import api from "./api";
import { joinSession, sendWhiteboardEvent, onReceiveWhiteboardEvent, onWhiteboardError, startWhiteboardConnection } from "./hubs/whiteboard";

// Whiteboard state storage keys
const latestKey = (sessionId: string) => `whiteboard:session:${sessionId}:latest`;
const boardsKey = (sessionId: string) => `whiteboard:session:${sessionId}:boards`;

/**
 * Initialize whiteboard session: join SignalR group and subscribe to remote updates.
 * onRemoteScene receives parsed scene objects that can be applied to Excalidraw.
 */
export async function initWhiteboardSession(sessionId: string, onRemoteScene: (scene: any) => void) {
  await startWhiteboardConnection();
  await joinSession(sessionId);

  onReceiveWhiteboardEvent((payload: any) => {
    try {
      // payload shape: { Id, SessionId, UserId, UserName, Type, PayloadJson, CreatedAt }
      const raw = payload?.payloadJson ?? payload?.PayloadJson ?? payload?.Payloadjson ?? payload?.payload;
      if (!raw) return;

      const scene = JSON.parse(raw);
      onRemoteScene(scene);
    } catch (e) {
      console.error("Invalid whiteboard payload", e, payload);
    }
  });

  onWhiteboardError((msg) => {
    console.error("Whiteboard hub error:", msg);
  });
}

/**
 * Send a full scene snapshot to other participants via the hub and persist locally.
 */
export async function sendSceneUpdate(sessionId: string, scene: any) {
  try {
    const payload = JSON.stringify(scene);
    await sendWhiteboardEvent(sessionId, "excalidraw_state", payload);
    // Also persist locally so new participants can load a recent snapshot
    try { localStorage.setItem(latestKey(sessionId), payload); } catch {};
  } catch (e) {
    console.error("Failed to send scene update:", e);
  }
}

/**
 * Save a named snapshot in localStorage (supports unlimited snapshots per session locally).
 */
export function saveBoardSnapshot(sessionId: string, scene: any, name?: string) {
  try {
    const id = String(Date.now());
    const collection = JSON.parse(localStorage.getItem(boardsKey(sessionId)) || "[]");
    const snapshotMeta = { id, name: name || `Snapshot ${new Date().toLocaleString()}`, savedAt: new Date().toISOString(), scene };
    collection.push(snapshotMeta);
    localStorage.setItem(boardsKey(sessionId), JSON.stringify(collection));
    // update latest
    localStorage.setItem(latestKey(sessionId), JSON.stringify(scene));

    // Also persist snapshot to server so it survives refreshes and is shared across clients
    (async () => {
      try {
        await api.post(`/whiteboard/sessions/${sessionId}/snapshots`, { name: snapshotMeta.name, scene });
      } catch (e) {
        console.error("Failed to persist snapshot to server:", e);
      }
    })();

    return id;
  } catch (e) {
    console.error("Failed to save board snapshot:", e);
    return null;
  }
}

/**
 * Load the most recent board state. First checks localStorage, then falls back to server events.
 */
export async function loadBoardState(sessionId: string): Promise<any | null> {
  try {
    const local = localStorage.getItem(latestKey(sessionId));
    if (local) return JSON.parse(local);

    // Fallback: fetch events from the server and find the latest excalidraw_state event
    const resp = await api.get(`/whiteboard/sessions/${sessionId}/events`);
    const events = resp.data as any[];
    if (!events || events.length === 0) return null;

    // Prefer events of type 'excalidraw_state' then 'draw'
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      const t = (e.type || e.Type || "").toLowerCase();
      if (t.includes("excalidraw") || t.includes("draw") ) {
        try {
          const scene = JSON.parse(e.payloadJson || e.PayloadJson || e.payload || e.Payload || "{}");
          return scene;
        } catch (ex) {
          // skip invalid
        }
      }
    }

    return null;
  } catch (e) {
    console.error("Failed to load board state:", e);
    return null;
  }
}

export function listBoardSnapshots(sessionId: string) {
  try {
    // Combine local snapshots with server persisted snapshots
    const local = JSON.parse(localStorage.getItem(boardsKey(sessionId)) || "[]");
    // Fetch server snapshots (async) and merge — return local immediately and let caller fetch server ones separately if needed
    (async () => {
      try {
        const resp = await api.get(`/whiteboard/sessions/${sessionId}/snapshots`);
        // server returns array of WhiteboardEventResponse with PayloadJson containing { name, scene }
        const server = (resp.data || []).map((e: any) => {
          let parsed = null;
          try { parsed = JSON.parse(e.payloadJson || e.PayloadJson || e.payload || e.Payload || "{}"); } catch { parsed = null; }
          return { id: e.id, name: parsed?.name ?? `Snapshot ${new Date(e.createdAt).toLocaleString()}`, savedAt: e.createdAt, scene: parsed?.scene ?? null };
        });
        // Merge server snapshots into local storage (avoid duplicates)
        const ids = new Set(local.map((s: any) => s.id));
        server.forEach((s: any) => { if (!ids.has(String(s.id))) local.push(s); });
        localStorage.setItem(boardsKey(sessionId), JSON.stringify(local));
      } catch (err) {
        // ignore
      }
    })();

    return local;
  } catch (e) {
    return [];
  }
}
