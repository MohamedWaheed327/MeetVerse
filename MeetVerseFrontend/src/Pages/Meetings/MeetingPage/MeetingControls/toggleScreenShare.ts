import { Room } from "livekit-client";

export const toggleScreenShare = async (roomRef: React.RefObject<Room | null>, isTogglingScreenShareRef: React.RefObject<boolean>, setScreenShareOff: (value: React.SetStateAction<boolean>) => void) => {
    const liveRoom = roomRef.current;
    if (!liveRoom || isTogglingScreenShareRef.current) return;
    isTogglingScreenShareRef.current = true;
    try {
        const shouldEnable = !liveRoom.localParticipant.isScreenShareEnabled;
        await liveRoom.localParticipant.setScreenShareEnabled(shouldEnable);
        setScreenShareOff(!shouldEnable);
        console.log("🖥️ Screen share state:", shouldEnable);
    } catch (err) {
        console.error("❌ Failed to toggle screen share:", err);
    } finally {
        isTogglingScreenShareRef.current = false;
    }
};