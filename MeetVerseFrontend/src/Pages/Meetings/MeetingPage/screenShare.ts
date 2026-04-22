import { Participant, Track } from "livekit-client";
import { getCameraPublications } from "./getParticipantPublications";

export const attachScreenShareTrackToArea = (track: Track, screenShareContainerRef: React.RefObject<HTMLDivElement | null>) => {
    const container = screenShareContainerRef.current;
    if (!container || track.kind !== "video") return;

    container.querySelectorAll("video").forEach((el) => {
        try {
            el.srcObject = null;
        } catch { }
        el.remove();
    });

    const element = track.attach() as HTMLVideoElement;
    element.autoplay = true;
    element.playsInline = true;
    element.className = "absolute inset-0 w-full h-full object-contain bg-black";

    container.appendChild(element);
};

export const removeScreenShareElement = (screenShareContainerRef: React.RefObject<HTMLDivElement | null>) => {
    const container = screenShareContainerRef.current;
    if (!container) return;

    container.querySelectorAll("video").forEach((video) => {
        try {
            video.srcObject = null;
        } catch { }
        video.remove();
    });
};