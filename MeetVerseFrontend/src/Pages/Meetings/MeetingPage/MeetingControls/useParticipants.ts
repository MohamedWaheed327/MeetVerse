import { useEffect, useState, useCallback, useRef } from "react";
import { meeting_chat_connection } from "../../../../services/hubs/connections";
import { SOCKET_EVENTS } from "./socketEvents";
import { useToast } from "../../../../Context/ToastContext";

export type User = {
    id: string;
    name: string;
    initial: string;
    color: string;
    isSpeaking: boolean;
    isLocal: boolean;
    hasVideo: boolean;
    hasMic: boolean;
};

export type ExtendedParticipant = User & {
    handRaised: boolean;
};

const playBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // 600 Hz
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1); // Slide up to 800 Hz

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05); // Fade in
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3); // Fade out

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export function useParticipants(meetingId: string | undefined, liveKitUsers: User[]) {
    const [handsRaised, setHandsRaised] = useState<Set<string>>(new Set());
    const [mediaStates, setMediaStates] = useState<Record<string, { isMicMuted?: boolean, isCameraOff?: boolean }>>({});
    const liveKitUsersRef = useRef(liveKitUsers);
    const { showToast } = useToast();

    useEffect(() => {
        liveKitUsersRef.current = liveKitUsers;
    }, [liveKitUsers]);

    useEffect(() => {
        if (!meetingId) return;

        const handleMeetingEvent = (data: any) => {
            // payload from backend:
            // { meetingId, senderId, senderName, eventType, payload, sentAt }
            
            if (data.meetingId !== meetingId) return;

            if (data.eventType === SOCKET_EVENTS.RAISE_HAND) {
                setHandsRaised(prev => {
                    const next = new Set(prev);
                    next.add(data.senderId);
                    return next;
                });
                
                // Don't show toast for ourselves
                const myUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid");
                if (data.senderId !== myUserId) {
                    playBeep();
                    showToast(`${data.senderName || "A participant"} raised their hand ✋`, "info");
                }
            } else if (data.eventType === SOCKET_EVENTS.LOWER_HAND) {
                setHandsRaised(prev => {
                    const next = new Set(prev);
                    next.delete(data.senderId);
                    return next;
                });
            } else if (data.eventType === SOCKET_EVENTS.MEDIA_STATE) {
                try {
                    const payload = JSON.parse(data.payload);
                    setMediaStates(prev => ({
                        ...prev,
                        [data.senderId]: {
                            isMicMuted: payload.isMicMuted ?? prev[data.senderId]?.isMicMuted,
                            isCameraOff: payload.isCameraOff ?? prev[data.senderId]?.isCameraOff
                        }
                    }));
                } catch (e) {}
            } else if (data.eventType === SOCKET_EVENTS.USER_JOINED) {
                const currentUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid") || "";
                if (data.senderId !== currentUserId) {
                    const localParticipant = liveKitUsersRef.current.find(p => p.isLocal);
                    if (localParticipant && meeting_chat_connection.state === "Connected") {
                        meeting_chat_connection.invoke("SendMeetingEvent", meetingId, SOCKET_EVENTS.MEDIA_STATE, JSON.stringify({
                            isMicMuted: !localParticipant.hasMic,
                            isCameraOff: !localParticipant.hasVideo
                        })).catch(() => {});
                    }
                }
            }
        };

        meeting_chat_connection.on("MeetingEventReceived", handleMeetingEvent);

        return () => {
            meeting_chat_connection.off("MeetingEventReceived", handleMeetingEvent);
        };
    }, [meetingId, showToast]);

    const toggleRaiseHand = useCallback(async () => {
        if (!meetingId) return;
        const currentUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid") || "";
        const isCurrentlyRaised = handsRaised.has(currentUserId);
        
        const eventType = isCurrentlyRaised ? SOCKET_EVENTS.LOWER_HAND : SOCKET_EVENTS.RAISE_HAND;

        try {
            if (meeting_chat_connection.state === "Connected") {
                await meeting_chat_connection.invoke("SendMeetingEvent", meetingId, eventType, {});
                
                // Optimistic update
                setHandsRaised(prev => {
                    const next = new Set(prev);
                    if (isCurrentlyRaised) next.delete(currentUserId);
                    else next.add(currentUserId);
                    return next;
                });
                
                if (!isCurrentlyRaised) {
                    showToast("You raised your hand ✋", "success");
                }
            } else {
                console.warn("Cannot raise hand: meeting_chat_connection is not connected");
            }
        } catch (error) {
            console.error("Failed to toggle hand raise:", error);
        }
    }, [meetingId, handsRaised, showToast]);

    // Merge LiveKit users with hand raise state and media state
    const participants: ExtendedParticipant[] = liveKitUsers.map(user => {
        const state = mediaStates[user.id] || {};
        return {
            ...user,
            handRaised: handsRaised.has(user.id),
            hasMic: state.isMicMuted !== undefined ? !state.isMicMuted : user.hasMic,
            hasVideo: state.isCameraOff !== undefined ? !state.isCameraOff : user.hasVideo
        };
    });

    const localParticipant = participants.find(p => p.isLocal);
    const isLocalHandRaised = localParticipant?.handRaised || false;

    return {
        participants,
        toggleRaiseHand,
        isLocalHandRaised,
        participantCount: participants.length
    };
}
