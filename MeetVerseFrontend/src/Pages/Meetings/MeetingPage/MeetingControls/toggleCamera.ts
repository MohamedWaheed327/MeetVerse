import { Room } from "livekit-client";

export const toggleCamera = async (roomRef: React.RefObject<Room | null>, isTogglingCameraRef: React.RefObject<boolean>, setCameraOff: React.Dispatch<any>) => {
    const liveRoom = roomRef.current;
    if (!liveRoom || isTogglingCameraRef.current) return;
    isTogglingCameraRef.current = true;
    try {
        const shouldEnable = !liveRoom.localParticipant.isCameraEnabled;
        await liveRoom.localParticipant.setCameraEnabled(shouldEnable);
        setCameraOff(!shouldEnable);
        console.log("📷 Camera state:", shouldEnable);
    } catch (err) {
        console.error("❌ Failed to toggle camera:", err);
    } finally {
        isTogglingCameraRef.current = false;
    }
};
