import { Participant } from "livekit-client";
import { getAudioPublications, getCameraPublications, getScreenSharePublications } from "./getParticipantPublications";

export const hasEnabledCameraTrack = (participant: Participant) => {
    return getCameraPublications(participant).some(
        (pub) => pub.track && !pub.isMuted
    );
};

export const hasEnabledAudioTrack = (participant: Participant) => {
    return getAudioPublications(participant).some(
        (pub) => pub.track && !pub.isMuted
    );
};

export const hasEnabledScreenShareTrack = (participant: Participant) => {
    return getScreenSharePublications(participant).some(
        (pub) => pub.track && !pub.isMuted
    );
};