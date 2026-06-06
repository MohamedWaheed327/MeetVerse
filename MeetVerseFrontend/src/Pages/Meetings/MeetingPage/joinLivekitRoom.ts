import { Participant, Room, RoomEvent, Track, TrackPublication } from "livekit-client";
import { getLivekitToken } from "./getLivekitToken";
import { attachAudioTrack, removeAudioElement } from "./attachAndRemoveAudioElement";
import { MEETING_ROOM_OPTIONS } from "./livekitConfig";

export const joinRoom = async (meetingId: string | undefined,
    state: any,
    cancelled: boolean,
    roomRef: React.RefObject<Room | null>,
    audioRefs: React.RefObject<Record<string, HTMLAudioElement | null>>,
    syncParticipants: (liveRoom: Room) => void,
    muted: any,
    cameraOff: any,
    onParticipantDisconnected?: (participant: Participant) => void) => {

    try {
        const token = await getLivekitToken(meetingId ?? "", state?.displayName);
        if (cancelled) return;
        const newRoom = new Room(MEETING_ROOM_OPTIONS);
        roomRef.current = newRoom;

        const handleTrackSubscribed = (track: Track, publication: TrackPublication, participant: Participant) => {
            console.log("trackSubscribed:", participant.identity, track.kind, publication?.source);

            if (publication.source == Track.Source.Microphone) {
                attachAudioTrack(track, participant.identity, audioRefs);
            }

            syncParticipants(newRoom);
        };

        const handleTrackUnsubscribed = (track: Track, publication: TrackPublication, participant: Participant) => {
            console.log("trackUnsubscribed:", participant.identity, track.kind, publication?.source);

            if (publication.source == Track.Source.Microphone) {
                removeAudioElement(participant.identity, audioRefs);
            }

            syncParticipants(newRoom);
        };

        const handleParticipantConnected = (participant: Participant) => {
            console.log("participantConnected:", participant.identity);
            syncParticipants(newRoom);
        };

        const handleParticipantDisconnected = (participant: Participant) => {
            console.log("participantDisconnected:", participant.identity);
            if (onParticipantDisconnected) onParticipantDisconnected(participant);
            syncParticipants(newRoom);
        };

        const handleTrackPublished = (publication: TrackPublication, participant: Participant) => {
            console.log("trackPublished:", participant.identity, publication.kind, publication.source);
            syncParticipants(newRoom);
        };

        const handleTrackUnpublished = (publication: TrackPublication, participant: Participant) => {
            console.log("trackUnpublished:", participant.identity, publication.kind, publication.source);
            syncParticipants(newRoom);
        };

        const handleTrackMuted = (publication: TrackPublication, participant: Participant) => {
            console.log("trackMuted:", participant.identity, publication.kind, publication.source);
            syncParticipants(newRoom);
        };

        const handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
            console.log("trackUnmuted:", participant.identity, publication.kind, publication.source);
            syncParticipants(newRoom);
        };

        const handleActiveSpeakersChanged = (activeSpeakers: Array<Participant>) => {
            console.log("ActiveSpeakersChanged:", activeSpeakers);
            syncParticipants(newRoom);
        };

        const handleLocalTrackPublished = (publication: TrackPublication) => {
            console.log("localTrackPublished:", publication.kind, publication.source);
            syncParticipants(newRoom);
        };

        const handleLocalTrackUnpublished = (publication: TrackPublication) => {
            console.log("localTrackUnpublished:", publication.kind, publication.source);
            syncParticipants(newRoom);
        };

        newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        newRoom.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        newRoom.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
        newRoom.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        newRoom.on(RoomEvent.TrackPublished, handleTrackPublished);
        newRoom.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        newRoom.on(RoomEvent.TrackMuted, handleTrackMuted);
        newRoom.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);
        newRoom.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        newRoom.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
        newRoom.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);
        const livekitUrl = import.meta.env.DEV
            ? (import.meta.env.VITE_LIVEKIT_DEV?.startsWith("ws") ? import.meta.env.VITE_LIVEKIT_DEV : import.meta.env.VITE_LIVEKIT_PROD)
            : import.meta.env.VITE_LIVEKIT_PROD;
        await newRoom.connect(livekitUrl, token);

        // if (muted) {
        //   // await newRoom.localParticipant.setMicrophoneEnabled(false);
        // }
        // else {
        //   const { localAudioTrack, cleanup } = await createProcessedMicTrack();
        //   cleanupRef.current = cleanup;
        //   await newRoom.localParticipant.publishTrack(localAudioTrack, {
        //     source: Track.Source.Microphone,
        //     name: 'processed-mic',
        //   });
        // }

        await newRoom.localParticipant.setMicrophoneEnabled(!muted);
        await newRoom.localParticipant.setCameraEnabled(!cameraOff);

        syncParticipants(newRoom);

        console.log("✅ Connected to LiveKit room successfully");
    } catch (err) {
        console.error("❌ LiveKit connect failed:", err);
    }
};