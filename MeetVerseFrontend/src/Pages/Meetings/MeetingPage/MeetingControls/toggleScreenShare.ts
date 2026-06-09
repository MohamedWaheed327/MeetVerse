import { Room } from "livekit-client";
import {
  SCREEN_SHARE_CAPTURE,
  SCREEN_SHARE_PUBLISH,
} from "../livekitConfig";

export const toggleScreenShare = async (
  roomRef: React.RefObject<Room | null>,
  isTogglingScreenShareRef: React.RefObject<boolean>,
  setScreenShareOff: (value: React.SetStateAction<boolean>) => void,
  showToast?: (message: string, type: "success" | "error" | "info") => void
) => {
  const liveRoom = roomRef.current;
  if (!liveRoom || isTogglingScreenShareRef.current) return;
  isTogglingScreenShareRef.current = true;
  try {
    const shouldEnable = !liveRoom.localParticipant.isScreenShareEnabled;
    // Mount the screen-share layout before capture so the container ref exists.
    setScreenShareOff(!shouldEnable);
    await liveRoom.localParticipant.setScreenShareEnabled(
      shouldEnable,
      SCREEN_SHARE_CAPTURE,
      SCREEN_SHARE_PUBLISH
    );
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === "NotAllowedError") {
      showToast?.(
        "Screen share permission was denied. Please allow it in your browser settings.",
        "error"
      );
    } else if (err.name === "NotFoundError") {
      showToast?.("No screen found to share.", "error");
    } else {
      showToast?.("Screen share failed. Please try again.", "error");
    }
    setScreenShareOff(true);
  } finally {
    isTogglingScreenShareRef.current = false;
  }
};
