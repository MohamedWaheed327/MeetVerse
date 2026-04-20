import { meeting_chat_connection } from "./connections";

type Message = {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
};

export const subscribeToMeeting = async (meetingId: string) => {
    await meeting_chat_connection.invoke("Subscribe", meetingId);
};

export const unsubscribeFromMeeting = async (meetingId: string) => {
    await meeting_chat_connection.invoke("UnSubscribe", meetingId);
};

export const onMessageReceived = (callback: (payload: Message) => void) => {
    meeting_chat_connection.on("MessageSent", (payload: Message) => {
        callback(payload);
    });
};

export const onError = (callback: (message: string) => void) => {
    meeting_chat_connection.on("Error", (message: string) => {
        callback(message);
    });
};