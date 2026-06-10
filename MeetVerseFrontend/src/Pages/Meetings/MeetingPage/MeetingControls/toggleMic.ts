import { Room, Track } from "livekit-client";
import { createProcessedMicTrack } from "../NoiseCancellation/createProcessedMicTrack";

const stopPublishedMicTracks = async (liveRoom: Room, cleanupRef: React.RefObject<(() => Promise<void>) | null>) => {
  await Promise.all(
    Array.from(liveRoom.localParticipant.trackPublications.values()).map(async (publication) => {
      if (publication.source === Track.Source.Microphone && publication.track) {
        await liveRoom.localParticipant.unpublishTrack(publication.track);
      }
    })
  );

  if (cleanupRef.current) {
    await cleanupRef.current();
    cleanupRef.current = null;
  }
};

export const publishMicTrack = async (
  roomRef: React.RefObject<Room | null>,
  cleanupRef: React.RefObject<(() => Promise<void>) | null>,
  useProcessedTrack: boolean
) => {
  const liveRoom = roomRef.current;
  if (!liveRoom) return;

  await stopPublishedMicTracks(liveRoom, cleanupRef);

  if (useProcessedTrack) {
    const { localAudioTrack, cleanup } = await createProcessedMicTrack();
    cleanupRef.current = cleanup;
    await liveRoom.localParticipant.publishTrack(localAudioTrack, {
      source: Track.Source.Microphone,
      name: "processed-mic",
    });
    return;
  }

  await liveRoom.localParticipant.setMicrophoneEnabled(true);
};

export const toggleMic = async (
  roomRef: React.RefObject<Room | null>,
  isTogglingMicRef: React.RefObject<boolean>,
  setMuted: (value: any) => void,
  cleanupRef: React.RefObject<(() => Promise<void>) | null>,
  useProcessedTrack = true
) => {
  const liveRoom = roomRef.current;
  if (!liveRoom || isTogglingMicRef.current) return;

  isTogglingMicRef.current = true;

  try {
    const shouldEnable = !liveRoom.localParticipant.isMicrophoneEnabled;

    if (shouldEnable) {
      await publishMicTrack(roomRef, cleanupRef, useProcessedTrack);
    } else {
      await stopPublishedMicTracks(liveRoom, cleanupRef);
      await liveRoom.localParticipant.setMicrophoneEnabled(false);
    }

    setMuted(!liveRoom.localParticipant.isMicrophoneEnabled);
    console.log("🎤 Mic state:", liveRoom.localParticipant.isMicrophoneEnabled);
  } catch (err) {
    console.error("❌ Failed to toggle microphone:", err);
  } finally {
    isTogglingMicRef.current = false;
  }
};

export const toggleNoiseCancellation = async (
  roomRef: React.RefObject<Room | null>,
  cleanupRef: React.RefObject<(() => Promise<void>) | null>,
  isNoiseCancellationEnabled: boolean,
  setNoiseCancellationEnabled: (value: boolean) => void,
  setMuted: (value: any) => void
) => {
  const liveRoom = roomRef.current;
  if (!liveRoom) return;

  const nextState = !isNoiseCancellationEnabled;

  try {
    if (!liveRoom.localParticipant.isMicrophoneEnabled) {
      setNoiseCancellationEnabled(nextState);
      return;
    }

    await stopPublishedMicTracks(liveRoom, cleanupRef);

    if (nextState) {
      await publishMicTrack(roomRef, cleanupRef, true);
    } else {
      await liveRoom.localParticipant.setMicrophoneEnabled(true);
    }

    setNoiseCancellationEnabled(nextState);
    setMuted(!liveRoom.localParticipant.isMicrophoneEnabled);
  } catch (err) {
    console.error("❌ Failed to toggle noise cancellation:", err);
  }
};