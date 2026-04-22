import { Track } from "livekit-client";

export const attachVideoTrackToElement = (track: Track, participantId: string, videoRefs: React.RefObject<Record<string, HTMLDivElement | null>>) => {
    const container = videoRefs.current[participantId];
    if (!container || track.kind !== "video") return;

    container.querySelectorAll("video").forEach((el) => {
        try {
            el.srcObject = null;
        } catch { }
        el.remove();
    });

    const element = track.attach() as HTMLVideoElement;
    element.id = `video-player-${participantId}`;
    element.autoplay = true;
    element.playsInline = true;
    // element.muted = participantId === roomRef.current?.localParticipant?.identity;
    element.className = "absolute inset-0 w-full h-full object-cover rounded-[2.5rem]";

    container.appendChild(element);
};

export const removeVideoElement = (participantId: string, videoRefs: React.RefObject<Record<string, HTMLDivElement | null>>) => {
    const container = videoRefs.current[participantId];
    if (!container) return;

    container.querySelectorAll("video").forEach((video) => {
        try {
            video.srcObject = null;
        } catch { }
        video.remove();
    });
};
