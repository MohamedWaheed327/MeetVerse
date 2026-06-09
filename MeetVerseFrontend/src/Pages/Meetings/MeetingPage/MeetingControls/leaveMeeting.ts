import { Room } from "livekit-client";
import { cleanupMediaElements } from "../cleanupMediaElements";

export const handleLeaveMeeting = (roomRef: React.RefObject<Room | null>
    , clearScheduledRenderSync: () => void
    , audioRefs: React.RefObject<Record<string, HTMLAudioElement | null>>
    , videoRefs: React.RefObject<Record<string, HTMLDivElement | null>>
    , screenShareContainerRef: React.RefObject<HTMLDivElement | null>) => {

    clearScheduledRenderSync();
    if (roomRef.current) {
        try {
            roomRef.current.removeAllListeners();
            roomRef.current.disconnect();
        } catch (err) {
            console.error("Room disconnect error:", err);
        }
    }

    // cleanupRef.current?.();
    cleanupMediaElements(audioRefs, videoRefs, screenShareContainerRef);
    roomRef.current = null;
};
