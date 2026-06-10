import { Room, Track } from "livekit-client";
import { createProcessedMicTrack } from "../NoiseCancellation/createProcessedMicTrack";

export const toggleMic = async (roomRef: React.RefObject<Room | null>, isTogglingMicRef: React.RefObject<boolean>, setMuted: (value: any) => void, cleanupRef: React.RefObject<(() => Promise<void>) | null>) => {
    const liveRoom = roomRef.current;
    if (!liveRoom || isTogglingMicRef.current) return;
    isTogglingMicRef.current = true;
    try {
        const shouldEnable = !liveRoom.localParticipant.isMicrophoneEnabled;
        if (shouldEnable) {
          const { localAudioTrack, cleanup } = await createProcessedMicTrack();
          cleanupRef.current = cleanup;
          await liveRoom.localParticipant.publishTrack(localAudioTrack, {
            source: Track.Source.Microphone,
            name: 'processed-mic',
          });
        }
        else {
          Array.from(liveRoom.localParticipant.trackPublications.values()).forEach(async (pub) => {
            if (pub.track) {
              await liveRoom.localParticipant.unpublishTrack(pub.track);
            }
          });
        }
        // await liveRoom.localParticipant.setMicrophoneEnabled(shouldEnable);
        setMuted(!shouldEnable);
        console.log("🎤 Mic state:", shouldEnable);
    } catch (err) {
        console.error("❌ Failed to toggle microphone:", err);
    } finally {
        isTogglingMicRef.current = false;
    }
};