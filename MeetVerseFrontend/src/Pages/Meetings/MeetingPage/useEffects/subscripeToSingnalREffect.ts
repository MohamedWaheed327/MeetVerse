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

export function subscripeToSingnalREffect(meetingId: string | undefined, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
    useEffect(() => {
        const start = async () => {
            try {
                if (meeting_chat_connection.state === HubConnectionState.Disconnected) {
                    await meeting_chat_connection.start();
                }
                // else if (meeting_chat_connection.state === HubConnectionState.Connected) {
                await subscribeToMeeting(meetingId ?? "");
                // }

                onMessageReceived((payload: Message) => {
                    setMessages((prev) => [...prev, payload]);
                });

                onError((err: unknown) => {
                    console.error("SignalR Error:", err);
                });
            } catch (err) {
                console.error("Connection error:", err);
            }
        };

        start();

        return () => {
            if (meeting_chat_connection.state === HubConnectionState.Connected) {
                unsubscribeFromMeeting(meetingId ?? "");
            }
            meeting_chat_connection.off("MessageSent");
            meeting_chat_connection.off("Error");
        };
    }, [meetingId]);
}