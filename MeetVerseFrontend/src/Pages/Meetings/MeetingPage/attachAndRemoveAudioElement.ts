import { Track } from "livekit-client";


export const attachAudioTrack = (track: Track, participantId: string, audioRefs: React.RefObject<Record<string, HTMLAudioElement | null>>) => {
    if (track.kind !== "audio") return;

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