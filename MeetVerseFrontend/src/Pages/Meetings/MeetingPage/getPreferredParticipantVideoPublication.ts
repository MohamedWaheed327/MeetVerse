import { Participant, Track } from "livekit-client";

export const getPreferredParticipantVideoPublication = (participant: Participant) => {
    return (
        participant.getTrackPublication(Track.Source.Camera)
        || participant.getTrackPublication(Track.Source.ScreenShare)
        || null
    );
};