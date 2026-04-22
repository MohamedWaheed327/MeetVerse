import { Track } from "livekit-client";

export const attachCameraTrackToElement = (track: Track, participantId: string, videoRefs: React.RefObject<Record<string, HTMLDivElement | null>>) => {
    const container = videoRefs.current[participantId];
    if (!container || track.kind !== "video") return;

    removeCameraElement(participantId, videoRefs);

    const element = track.attach() as HTMLVideoElement;
    element.id = `video-player-${participantId}`;
    element.autoplay = true;
    element.playsInline = true;
    // element.muted = participantId === roomRef.current?.localParticipant?.identity;
    element.className = "absolute inset-0 w-full h-full object-cover rounded-[2.5rem]";

    container.appendChild(element);
};

export const removeCameraElement = (participantId: string, videoRefs: React.RefObject<Record<string, HTMLDivElement | null>>) => {
    const container = videoRefs.current[participantId];
    if (!container) return;

    container.querySelectorAll("video").forEach((video) => {
        try {
            video.srcObject = null;
        } catch { }
        video.remove();
    });
};
