import { useState, useCallback } from "react";
import { Download, HardDriveUpload, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { requestGoogleDriveAccessToken } from "../../utils/googleDriveAuth";
import { uploadRecordingToDrive, type UploadToDriveResponse } from "../../services/uploadToDrive";

type DriveUploadStatus = "idle" | "authenticating" | "uploading" | "success" | "error";

interface SaveRecordingActionProps {
  recordingBlob: Blob;
  fileName?: string;
}

export const SaveRecordingAction = ({
  recordingBlob,
  fileName = "meeting-recording.webm",
}: SaveRecordingActionProps) => {
  const [driveStatus, setDriveStatus] = useState<DriveUploadStatus>("idle");
  const [driveResult, setDriveResult] = useState<UploadToDriveResponse | null>(null);
  const [driveError, setDriveError] = useState<string>("");

  const handleSaveLocally = useCallback(() => {
    const url = URL.createObjectURL(recordingBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [recordingBlob, fileName]);

  const handleSaveToDrive = useCallback(async () => {
    setDriveStatus("authenticating");
    setDriveError("");
    setDriveResult(null);

    try {
      const accessToken = await requestGoogleDriveAccessToken();

      setDriveStatus("uploading");

      const file = new File([recordingBlob], fileName, {
        type: recordingBlob.type || "video/webm",
      });

      const result = await uploadRecordingToDrive(file, accessToken);
      setDriveResult(result);
      setDriveStatus("success");
    } catch (err) {
      setDriveError(
        err instanceof Error ? err.message : "Failed to save to Google Drive."
      );
      setDriveStatus("error");
    }
  }, [recordingBlob, fileName]);

  const getDriveButtonContent = () => {
    switch (driveStatus) {
      case "authenticating":
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to Google…</span>
          </>
        );
      case "uploading":
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Uploading to Drive…</span>
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Saved to Google Drive</span>
          </>
        );
      case "error":
        return (
          <>
            <XCircle className="w-5 h-5" />
            <span>Retry Upload</span>
          </>
        );
      default:
        return (
          <>
            <HardDriveUpload className="w-5 h-5" />
            <span>Save to Google Drive</span>
          </>
        );
    }
  };

  const isDriveLoading = driveStatus === "authenticating" || driveStatus === "uploading";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Save Locally Button */}
      <button
        onClick={handleSaveLocally}
        className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl
          bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100
          hover:bg-gray-200 dark:hover:bg-gray-700
          transition-colors duration-200 font-medium cursor-pointer"
      >
        <Download className="w-5 h-5" />
        <span>Save Locally</span>
      </button>

      {/* Save to Google Drive Button */}
      <button
        onClick={handleSaveToDrive}
        disabled={isDriveLoading || driveStatus === "success"}
        className={`flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl
          font-medium transition-colors duration-200
          ${
            driveStatus === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
              : driveStatus === "error"
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
              : isDriveLoading
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-wait"
              : "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer"
          }`}
      >
        {getDriveButtonContent()}
      </button>

      {/* Success: Drive Link */}
      {driveStatus === "success" && driveResult && (
        <a
          href={driveResult.webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            text-sm text-blue-600 dark:text-blue-400
            bg-blue-50 dark:bg-blue-900/20
            hover:bg-blue-100 dark:hover:bg-blue-900/40
            transition-colors duration-200"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open in Google Drive</span>
        </a>
      )}

      {/* Error Message */}
      {driveStatus === "error" && driveError && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          {driveError}
        </p>
      )}
    </div>
  );
};
