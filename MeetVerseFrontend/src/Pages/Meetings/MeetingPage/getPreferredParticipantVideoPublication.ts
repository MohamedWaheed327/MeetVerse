import { Participant } from "livekit-client";
import { getCameraPublications } from "./getParticipantPublications";

export const getPreferredParticipantVideoPublication = (participant: Participant) => {
    return (
        getCameraPublications(participant).find(
            (pub) => pub.track && !pub.isMuted
        ) ||
        // participant.getTrackPublication(Track.Source.Camera) as TrackPublication ||
        null
    );
};