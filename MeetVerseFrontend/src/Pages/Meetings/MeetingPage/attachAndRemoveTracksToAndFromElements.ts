import { Track } from "livekit-client";

export const attachScreenShareTrackToArea = (track: Track, screenShareContainerRef: React.RefObject<HTMLDivElement | null>) => {
    const container = screenShareContainerRef.current;
    if (!container || track.kind !== "video") return;

    removeScreenShareElement(screenShareContainerRef);

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

export const attachVideoTrackToElement = (track: Track, participantId: string, videoRefs: React.RefObject<Record<string, HTMLDivElement | null>>) => {
    const container = videoRefs.current[participantId];
    if (!container || track.kind !== Track.Kind.Video) return;

    removeVideoElement(participantId, videoRefs);

    const element = track.attach() as HTMLVideoElement;
    element.id = `video-player-${participantId}`;
    element.autoplay = true;
    element.playsInline = true;
    // element.muted = (participantId === roomRef.current?.localParticipant?.identity);
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

export const attachAudioTrack = (track: Track, participantId: string, audioRefs: React.RefObject<Record<string, HTMLAudioElement | null>>) => {
    if (track.kind !== Track.Kind.Audio) return;

    removeAudioElement(participantId, audioRefs);

    const audioElement = track.attach() as HTMLAudioElement;
    audioElement.autoplay = true;
    audioElement.style.display = "none";
    audioElement.setAttribute("data-participant-id", participantId);

    document.body.appendChild(audioElement);
    audioRefs.current[participantId] = audioElement;
};

export const removeAudioElement = (participantId: string, audioRefs: React.RefObject<Record<string, HTMLAudioElement | null>>) => {
    const audioElement = audioRefs.current[participantId];
    if (!audioElement) return;

    try {
        audioElement.srcObject = null;
    } catch { }

    audioElement.remove();
    delete audioRefs.current[participantId];
};
