import connection from "./connections";

type Message = {
    id: string;
    senderName: string;
    content: string;
};

export const subscribeToMeeting = async (meetingId: string) => {
    await connection.invoke("Subscribe", meetingId);
};

export const unsubscribeFromMeeting = async (meetingId: string) => {
    await connection.invoke("UnSubscribe", meetingId);
};

export const onMessageReceived = (callback: (payload: Message) => void) => {
    connection.on("MessageSent", (payload: Message) => {
        callback(payload);
    });
};

export const onError = (callback: (message: string) => void) => {
    connection.on("Error", (message: string) => {
        callback(message);
    });
};