import { Participant } from "livekit-client";

export const getParticipantDisplayName = (participant: Participant, isLocal = false) => {
    if (isLocal) return participant?.name || "You";
    return participant?.name || "User";
};