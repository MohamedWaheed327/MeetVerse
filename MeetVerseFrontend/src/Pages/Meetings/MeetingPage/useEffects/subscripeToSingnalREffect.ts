import { useEffect } from "react";
import { onError, onMessageReceived, subscribeToMeeting, unsubscribeFromMeeting } from "../../../../services/hubs/meetingChat";
import { meeting_chat_connection } from "../../../../services/hubs/connections";
import { HubConnectionState } from "@microsoft/signalr";

type Message = {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
};

// Global subscription tracker to prevent race conditions during React double-mounts
const activeMeetingSubscriptions: Record<string, number> = {};

export function subscripeToSingnalREffect(
    meetingId: string | undefined, 
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setIsSessionReady?: React.Dispatch<React.SetStateAction<boolean>>
) {
    const currentUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid");
    useEffect(() => {
        if (!currentUserId || !meetingId) return;

        let active = true;
        activeMeetingSubscriptions[meetingId] = (activeMeetingSubscriptions[meetingId] || 0) + 1;

        const start = async () => {
            try {
                if (meeting_chat_connection.state === HubConnectionState.Disconnected) {
                    await meeting_chat_connection.start();
                } else if (meeting_chat_connection.state === HubConnectionState.Connecting) {
                    while (meeting_chat_connection.state === HubConnectionState.Connecting) {
                        if (!active) return;
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                }
                if (!active) return;

                if (meeting_chat_connection.state === HubConnectionState.Connected) {
                    await subscribeToMeeting(meetingId);
                }
                if (!active) return;

                meeting_chat_connection.off("joinedsession");
                meeting_chat_connection.on("joinedsession", (data) => {
                    if (!active) return;
                    console.log('Session joined confirmed:', data);
                    if (setIsSessionReady) {
                        setIsSessionReady(true);
                    }
                    // Broadcast USER_JOINED so other participants sync their state to us
                    meeting_chat_connection.invoke("SendMeetingEvent", meetingId, "USER_JOINED", {}).catch(() => {});
                });

                meeting_chat_connection.off("MessageSent");
                onMessageReceived((payload: Message) => {
                    if (!active) return;
                    setMessages((prev) => {
                        // Prevent adding duplicate messages in state
                        if (prev.some((m) => m.id === payload.id)) {
                            return prev;
                        }
                        return [...prev, payload];
                    });
                });

                meeting_chat_connection.off("Error");
                onError((err: unknown) => {
                    if (!active) return;
                    console.error("SignalR Error:", err);
                });
            } catch (err) {
                console.error("Connection error:", err);
            }
        };

        start();

        return () => {
            active = false;
            meeting_chat_connection.off("joinedsession");
            meeting_chat_connection.off("MessageSent");
            meeting_chat_connection.off("Error");

            activeMeetingSubscriptions[meetingId]--;
            setTimeout(() => {
                if (activeMeetingSubscriptions[meetingId] === 0 && meeting_chat_connection.state === HubConnectionState.Connected) {
                    unsubscribeFromMeeting(meetingId).catch(() => {});
                }
            }, 100);
        };
    }, [meetingId, currentUserId, setIsSessionReady, setMessages]);
}