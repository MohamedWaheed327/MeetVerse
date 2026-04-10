import { Participant, Room, Track } from "livekit-client";

const isCameraSource = (source: Track.Source) => {
    return source === Track.Source.Camera;
};

const getCameraPublications = (participant: Participant) => {
    return Array.from(participant?.videoTrackPublications?.values?.() || []).filter(
        (pub) => isCameraSource(pub.source)
    );
};


const hasEnabledCameraTrack = (participant: Participant) => {
    return getCameraPublications(participant).some(
        (pub) => pub.track && !pub.isMuted
    );
};

export const buildParticipantsList = (liveRoom: Room) => {
    if (!liveRoom) return [];

    const colorPool = [
        "from-blue-600 to-indigo-700",
        "from-purple-600 to-pink-600",
        "from-emerald-600 to-teal-600",
        "from-orange-600 to-red-600",
        "from-cyan-600 to-blue-600",
        "from-fuchsia-600 to-rose-600",
    ];

    const localParticipant = liveRoom.localParticipant;

    const localUser = {
        id: localParticipant.identity,
        name: `${localParticipant.name || "You"} (You)`,
        initial: localParticipant.name?.charAt(0)?.toUpperCase() || "Y",
        color: colorPool[0],
        isSpeaking: localParticipant.isSpeaking || false,
        isLocal: true,
        hasVideo: hasEnabledCameraTrack(localParticipant),
    };

    const remoteUsers = Array.from(liveRoom.remoteParticipants.values()).map(
        (participant, index) => ({
            id: participant.identity,
            name: participant.name || "User",
            initial: participant.name?.charAt(0)?.toUpperCase() || "U",
            color: colorPool[(index + 1) % colorPool.length],
            isSpeaking: participant.isSpeaking || false,
            isLocal: false,
            hasVideo: hasEnabledCameraTrack(participant),
        })
    );

    return [localUser, ...remoteUsers];
};
