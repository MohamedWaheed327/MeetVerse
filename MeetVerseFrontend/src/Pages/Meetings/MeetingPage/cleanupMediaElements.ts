import { removeAudioElement } from "./attachAndRemoveAudioElement";
import { removeVideoElement } from "./attachAndRemoveCameraElement";
import { removeScreenShareElement } from "./screenShare";


export const cleanupMediaElements = (
    audioRefs: React.RefObject<Record<string, HTMLAudioElement | null>>
    , videoRefs: React.RefObject<Record<string, HTMLDivElement | null>>
    , screenShareContainerRef: React.RefObject<HTMLDivElement | null>
) => {
    Object.keys(videoRefs.current).forEach((participantId) => {
        removeVideoElement(participantId, videoRefs);
    });

    Object.keys(audioRefs.current).forEach((participantId) => {
        removeAudioElement(participantId, audioRefs);
    });

    removeScreenShareElement(screenShareContainerRef);
};
