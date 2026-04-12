import { Room, Track } from "livekit-client";

export const getActiveScreenShare = (liveRoom: Room, identity: string | null) => {
    if (!liveRoom) return null;
    if (identity == null) {
        const allParticipants = [
            liveRoom.localParticipant,
            ...Array.from(liveRoom.remoteParticipants.values()),
        ];

        for (const participant of allParticipants) {
            const activePub = participant.getTrackPublication(Track.Source.ScreenShare);

            if (activePub) {
                return {
                    publication: activePub,
                    participant,
                    isLocal: participant.identity === liveRoom.localParticipant.identity,
                };
            }
        }
    }
    else {
        var participant = liveRoom.getParticipantByIdentity(identity);
        const activePub = participant!.getTrackPublication(Track.Source.ScreenShare);

        if (activePub) {
            return {
                publication: activePub,
                participant,
                isLocal: participant!.identity === liveRoom.localParticipant.identity,
            };
        }
    }

    return null;
};