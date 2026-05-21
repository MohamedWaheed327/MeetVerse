import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from "react";
import {
  Loader2,
  AlertCircle,
  Download,
  FileImage,
  FileText,
  FileCode,
  Trash2,
  Save,
  History,
  RotateCcw,
  ChevronDown,
  X,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { getOrCreateWhiteboardSession } from "../../../../services/whiteboard";
import api from "../../../../services/api";

// Excalidraw integration
// @ts-ignore
import { Excalidraw, exportToBlob, exportToSvg } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
// @ts-ignore
import "@excalidraw/excalidraw/index.css";

// PDF generation
import { jsPDF } from "jspdf";

import {
  initWhiteboardSession,
  sendSceneUpdate,
  loadBoardState,
  saveBoardSnapshot,
} from "../../../../services/whiteboardService";

/* ───────────────────────── Types ──────────────────────── */
export interface WhiteboardPanelHandle {
  exportPDF: () => void;
}

interface WhiteboardPanelProps {
  meetingId: string;
}

interface SnapshotItem {
  id: string;
  name: string;
  savedAt: string;
  scene: any;
  raw?: any;
}

/* ──────────────────── Toast Component ─────────────────── */
function MiniToast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  const bg = type === "success" ? "bg-emerald-600" : type === "error" ? "bg-red-600" : "bg-blue-600";
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Download;

  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`flex items-center gap-2.5 px-5 py-3 rounded-xl ${bg} text-white shadow-2xl text-sm font-medium animate-[slideUp_0.3s_ease-out]`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ────────────────── Main Component ────────────────── */
const WhiteboardPanel = React.forwardRef<WhiteboardPanelHandle, WhiteboardPanelProps>(
  function WhiteboardPanel({ meetingId }, ref) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const debounceRef = useRef<number | null>(null);
  const isApplyingRemote = useRef(false);

  // Track latest scene from onChange — this is the reliable source of truth
  const latestElementsRef = useRef<any[]>([]);
  const latestAppStateRef = useRef<any>({});
  const latestFilesRef = useRef<any>({});

  // Snapshots
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Retry-on-failure tracking
  const [lastFailedExport, setLastFailedExport] = useState<string | null>(null);
  const retryExportRef = useRef(0);
  const [isExporting, setIsExporting] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  /* ─── Initialization ─── */
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const session = await getOrCreateWhiteboardSession(meetingId);
        if (!mounted) return;
        setSessionId(session.id);

        // Join SignalR group + subscribe to remote updates
        await initWhiteboardSession(session.id, async (scene) => {
          const currentUserId = localStorage.getItem("userid");
          try {
            if (scene?.__meta?.userId && scene.__meta.userId === currentUserId) return;
          } catch { /* ignore */ }

          if (!excalidrawRef.current) return;

          isApplyingRemote.current = true;
          try {
            await excalidrawRef.current.updateScene({
              elements: scene.elements ?? [],
              appState: scene.appState ?? {},
            });
          } catch (e) {
            console.error("Failed to apply remote scene:", e);
          } finally {
            setTimeout(() => (isApplyingRemote.current = false), 50);
          }
        });

        // Load last saved state
        const initial = await loadBoardState(session.id);
        if (initial && excalidrawRef.current) {
          await excalidrawRef.current.updateScene({
            elements: initial.elements ?? [],
            appState: initial.appState ?? {},
          });
        }

        // Load snapshots
        await loadSnapshotsFromServer(session.id);
      } catch (err) {
        console.error(err);
        setError("Failed to initialize whiteboard.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    start();
    return () => { mounted = false; };
  }, [meetingId]);

  /* ─── Scene Change Handler ─── */
  const handleChange = useCallback(
    (elements: any[], state: any) => {
      // Always track the latest scene for export, even if not connected yet
      latestElementsRef.current = elements;
      latestAppStateRef.current = state;
      // Also track files if available
      if (excalidrawRef.current?.getFiles) {
        try { latestFilesRef.current = excalidrawRef.current.getFiles() || {}; } catch { /* ignore */ }
      }

      if (!sessionId || isApplyingRemote.current) return;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(async () => {
        try {
          const scene = {
            elements,
            appState: state,
            __meta: { updatedAt: Date.now(), userId: localStorage.getItem("userid") },
          };
          await sendSceneUpdate(sessionId, scene);
          saveBoardSnapshot(sessionId, scene);
        } catch (e) {
          console.error("Failed to send scene update:", e);
        }
      }, 300);
    },
    [sessionId]
  );

  /* ─── Snapshot Management ─── */
  const loadSnapshotsFromServer = async (sid: string) => {
    try {
      const resp = await api.get(`/whiteboard/sessions/${sid}/snapshots`);
      const arr = (resp.data || []).map((e: any) => {
        let parsed = null;
        try {
          parsed = JSON.parse(e.payloadJson || e.PayloadJson || e.payload || e.Payload || "{}");
        } catch { parsed = null; }
        return {
          id: e.id,
          name: parsed?.name ?? `Snapshot ${new Date(e.createdAt).toLocaleString()}`,
          savedAt: e.createdAt,
          scene: parsed?.scene ?? null,
          raw: e,
        };
      });
      setSnapshots(arr);
    } catch { /* ignore */ }
  };

  const handleSaveSnapshot = async () => {
    if (!sessionId) return;
    const name = window.prompt("Snapshot name (optional)");
    try {
      const elements = (latestElementsRef.current || []).filter((el: any) => !el.isDeleted);
      const appState = latestAppStateRef.current || {};
      const scene = { elements, appState };
      await saveBoardSnapshot(sessionId, scene, name || undefined);
      await loadSnapshotsFromServer(sessionId);
      showToast("Snapshot saved successfully!", "success");
    } catch (e) {
      console.error("Failed to save snapshot:", e);
      showToast("Failed to save snapshot.", "error");
    }
  };

  const handleRestore = async (s: SnapshotItem) => {
    if (!sessionId || !excalidrawRef.current) return;
    if (!s?.scene) {
      showToast("Snapshot has no scene data.", "error");
      return;
    }
    try {
      isApplyingRemote.current = true;
      await excalidrawRef.current.updateScene({
        elements: s.scene.elements ?? [],
        appState: s.scene.appState ?? {},
      });
      await sendSceneUpdate(sessionId, s.scene);
      await saveBoardSnapshot(sessionId, s.scene, `Restore - ${s.name}`);
      setShowSnapshots(false);
      showToast(`Restored: ${s.name}`, "success");
    } catch (e) {
      console.error("Failed to restore snapshot:", e);
      showToast("Failed to restore snapshot.", "error");
    } finally {
      setTimeout(() => (isApplyingRemote.current = false), 50);
    }
  };

  /* ─── Clear Board ─── */
  const handleClearBoard = () => {
    if (!excalidrawRef.current) return;
    if (!window.confirm("Are you sure you want to clear the entire board? This cannot be undone.")) return;
    try {
      excalidrawRef.current.updateScene({ elements: [] });
      if (sessionId) {
        const scene = { elements: [], appState: {}, __meta: { updatedAt: Date.now(), userId: localStorage.getItem("userid") } };
        sendSceneUpdate(sessionId, scene);
      }
      showToast("Board cleared.", "info");
    } catch (e) {
      console.error("Failed to clear board:", e);
    }
  };

  /* ─── Export Helpers ─── */
  const getSceneData = () => {
    // Primary: use tracked refs from onChange (always up-to-date)
    const trackedElements = latestElementsRef.current || [];
    // Filter to only non-deleted elements
    const liveElements = trackedElements.filter((el: any) => !el.isDeleted);

    if (liveElements.length > 0) {
      return {
        elements: [...liveElements],
        appState: latestAppStateRef.current || {},
        files: latestFilesRef.current || {},
      };
    }

    // Fallback: try imperative API
    if (excalidrawRef.current) {
      try {
        const apiElements = excalidrawRef.current.getSceneElements?.() || [];
        const fallback = [...apiElements].filter((el: any) => !el.isDeleted);
        if (fallback.length > 0) {
          return {
            elements: fallback,
            appState: excalidrawRef.current.getAppState?.() || {},
            files: excalidrawRef.current.getFiles?.() || {},
          };
        }
      } catch { /* ignore */ }
    }

    return { elements: [], appState: {}, files: {} };
  };

  const handleExportPNG = async () => {
    const data = getSceneData();
    if (!data || data.elements.length === 0) {
      showToast("Nothing to export — draw something first!", "error");
      return;
    }
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const blob = await exportToBlob({
        elements: data.elements,
        appState: { ...data.appState, exportWithDarkMode: false, exportBackground: true },
        files: data.files,
        getDimensions: () => ({ width: 1920, height: 1080, scale: 2 }),
      });
      downloadBlob(blob, `MeetVerse-Whiteboard-${Date.now()}.png`);
      showToast("PNG exported successfully!", "success");
    } catch (e) {
      console.error("PNG export failed:", e);
      showToast("Failed to export PNG.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = async () => {
    const data = getSceneData();
    if (!data || data.elements.length === 0) {
      showToast("Nothing to export — draw something first!", "error");
      return;
    }
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const svg = await exportToSvg({
        elements: data.elements,
        appState: { ...data.appState, exportWithDarkMode: false, exportBackground: true },
        files: data.files,
      });
      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      downloadBlob(blob, `MeetVerse-Whiteboard-${Date.now()}.svg`);
      showToast("SVG exported successfully!", "success");
    } catch (e) {
      console.error("SVG export failed:", e);
      showToast("Failed to export SVG.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    const data = getSceneData();
    if (!data || data.elements.length === 0) {
      showToast("⚠️ The whiteboard is empty. Add some content before exporting.", "error");
      return;
    }

    // Prompt user for a filename before proceeding
    const defaultName = `MeetVerse-Whiteboard-${new Date().toLocaleDateString().replace(/\//g, '-')}`;
    const userFilename = window.prompt("Enter a filename for the PDF:", defaultName);
    if (userFilename === null) {
      // User clicked Cancel — abort export
      return;
    }
    const safeName = userFilename.trim() || defaultName;

    setIsExporting(true);
    setShowExportMenu(false);
    try {
      // Calculate bounding box of all non-deleted elements
      const elements = data.elements;
      const bounds = elements.reduce(
        (acc: { minX: number; minY: number; maxX: number; maxY: number }, el: any) => {
          const right = el.x + el.width;
          const bottom = el.y + el.height;
          return {
            minX: Math.min(acc.minX, el.x),
            minY: Math.min(acc.minY, el.y),
            maxX: Math.max(acc.maxX, right),
            maxY: Math.max(acc.maxY, bottom),
          };
        },
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );

      const padding = 100;
      const rawWidth = bounds.maxX - bounds.minX + padding * 2;
      const rawHeight = bounds.maxY - bounds.minY + padding * 2;

      // Clamp dimensions: minimum 1200x800, maximum 8000x8000
      const exportWidth = Math.min(Math.max(rawWidth, 1200), 8000);
      const exportHeight = Math.min(Math.max(rawHeight, 800), 8000);

      // Generate a high-res PNG blob from Excalidraw using calculated dimensions
      const blob = await exportToBlob({
        elements: data.elements,
        appState: { ...data.appState, exportWithDarkMode: false, exportBackground: true },
        files: data.files,
        getDimensions: () => ({ width: exportWidth, height: exportHeight, scale: 2 }),
      });

      // Convert blob to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Load the image to get actual rendered dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      // Create PDF (A4 landscape)
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm

      const imgMargin = 14;
      const headerHeight = 16; // space for header (0–16mm)
      const footerHeight = 12; // space for footer
      const contentAreaHeight = pageHeight - headerHeight - footerHeight;
      const maxImgWidth = pageWidth - imgMargin * 2;

      // Scale image to fit page width, then check if multi-page is needed
      const scaledImgWidth = maxImgWidth;
      const scaledImgHeight = (img.height / img.width) * scaledImgWidth;
      const totalPages = Math.ceil(scaledImgHeight / contentAreaHeight);

      // Create an offscreen canvas to slice the full image for multi-page support
      const offCanvas = document.createElement("canvas");
      const offCtx = offCanvas.getContext("2d")!;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        // Header
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text("MeetVerse — Whiteboard Export", 14, 10);
        pdf.text(new Date().toLocaleString(), pageWidth - 14, 10, { align: "right" });

        // Draw a subtle line under header
        pdf.setDrawColor(200, 200, 200);
        pdf.line(14, 13, pageWidth - 14, 13);

        // Calculate the slice of the source image for this page
        const srcYStart = (page * contentAreaHeight / scaledImgHeight) * img.height;
        const srcSliceHeight = (contentAreaHeight / scaledImgHeight) * img.height;
        const actualSrcHeight = Math.min(srcSliceHeight, img.height - srcYStart);

        // Determine the rendered height for this page slice
        const sliceRatio = actualSrcHeight / img.height;
        const renderedSliceHeight = sliceRatio * scaledImgHeight;

        // Draw the slice onto the offscreen canvas
        offCanvas.width = img.width;
        offCanvas.height = Math.round(actualSrcHeight);
        offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        offCtx.drawImage(
          img,
          0, Math.round(srcYStart), img.width, Math.round(actualSrcHeight),
          0, 0, img.width, Math.round(actualSrcHeight)
        );

        const sliceDataUrl = offCanvas.toDataURL("image/png");
        const imgX = (pageWidth - scaledImgWidth) / 2;
        pdf.addImage(sliceDataUrl, "PNG", imgX, headerHeight, scaledImgWidth, renderedSliceHeight);

        // Footer with page number
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Generated by MeetVerse Whiteboard  •  Page ${page + 1} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );
      }

      pdf.save(`${safeName}.pdf`);
      showToast("PDF exported successfully!", "success");
      // Reset retry tracking on success
      retryExportRef.current = 0;
      setLastFailedExport(null);
    } catch (e) {
      console.error("PDF export failed:", e);
      retryExportRef.current += 1;
      setLastFailedExport("pdf");
      if (retryExportRef.current >= 3) {
        showToast("PDF export failed after multiple attempts. Please try again later.", "error");
        retryExportRef.current = 0;
      } else {
        showToast("PDF export failed. Click Export again to retry.", "error");
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Expose exportPDF to parent via ref
  useImperativeHandle(ref, () => ({
    exportPDF: handleExportPDF,
  }));

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ─── Close menus on outside click ─── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-export-menu]") && !target.closest("[data-snapshot-menu]")) {
        setShowExportMenu(false);
        setShowSnapshots(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ─── Loading State ─── */
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#181B26] rounded-[2.5rem] border-2 border-[#2A2E3B] shadow-xl">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Preparing Whiteboard...</p>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#181B26] rounded-[2.5rem] border-2 border-[#2A2E3B] shadow-xl text-red-400">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  /* ─── Render ─── */
  return (
    <div className="w-full h-full rounded-[2.5rem] border-2 border-[#2A2E3B] overflow-hidden shadow-xl bg-[#181B26] relative">
      {/* Excalidraw Canvas */}
      <div className="absolute inset-0">
        <Excalidraw
          ref={(refApi: any) => (excalidrawRef.current = refApi)}
          onChange={(elements: any[], state: any) => handleChange(elements, state)}
          theme="dark"
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
            },
          }}
        />
      </div>

      {/* ─── Premium Toolbar ─── */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
        {/* Save Snapshot */}
        <button
          onClick={handleSaveSnapshot}
          title="Save Snapshot"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Save className="w-4 h-4" />
          Save
        </button>

        {/* Export Dropdown */}
        <div className="relative" data-export-menu>
          <button
            onClick={() => { setShowExportMenu((v) => !v); setShowSnapshots(false); }}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#1E2233] border border-[#2F3549] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              <div className="px-4 py-3 border-b border-[#2F3549]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Export Whiteboard</p>
              </div>

              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#262B3D] transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center group-hover:bg-red-500/25 transition-colors">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Export as PDF</p>
                  <p className="text-xs text-slate-400">Best for printing & sharing</p>
                </div>
              </button>

              <button
                onClick={handleExportPNG}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#262B3D] transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/25 transition-colors">
                  <FileImage className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Export as PNG</p>
                  <p className="text-xs text-slate-400">High-resolution image</p>
                </div>
              </button>

              <button
                onClick={handleExportSVG}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#262B3D] transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center group-hover:bg-violet-500/25 transition-colors">
                  <FileCode className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Export as SVG</p>
                  <p className="text-xs text-slate-400">Scalable vector graphics</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Snapshots Dropdown */}
        <div className="relative" data-snapshot-menu>
          <button
            onClick={() => {
              setShowSnapshots((v) => !v);
              setShowExportMenu(false);
              if (!showSnapshots && sessionId) loadSnapshotsFromServer(sessionId);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2233] hover:bg-[#262B3D] border border-[#2F3549] text-white rounded-xl text-sm font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <History className="w-4 h-4" />
            Snapshots
            {snapshots.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {snapshots.length > 9 ? "9+" : snapshots.length}
              </span>
            )}
          </button>

          {showSnapshots && (
            <div className="absolute right-0 mt-2 w-96 bg-[#1E2233] border border-[#2F3549] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              <div className="px-4 py-3 border-b border-[#2F3549] flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Snapshots</p>
                <button onClick={() => setShowSnapshots(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto scrollbar-custom">
                {snapshots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <History className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">No snapshots yet</p>
                    <p className="text-xs mt-1">Click "Save" to create one</p>
                  </div>
                ) : (
                  snapshots.map((s, index) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-[#262B3D] transition-colors ${
                        index < snapshots.length - 1 ? "border-b border-[#2F3549]/50" : ""
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                        <p className="text-xs text-slate-400">
                          {s.savedAt ? new Date(s.savedAt).toLocaleString() : "Unknown date"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestore(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear Board */}
        <button
          onClick={handleClearBoard}
          title="Clear Board"
          className="flex items-center justify-center w-10 h-10 bg-[#1E2233] hover:bg-red-600/80 border border-[#2F3549] hover:border-red-500/50 text-slate-400 hover:text-white rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
          <MiniToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
  }
);

export default WhiteboardPanel;
