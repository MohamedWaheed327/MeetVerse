// meetingChat.js
import connection from "./connections";

export const subscribeToMeeting = async (meetingId) => {
    await connection.invoke("Subscribe", meetingId);
};

export const unsubscribeFromMeeting = async (meetingId) => {
    await connection.invoke("UnSubscribe", meetingId);
};

export const onMessageReceived = (callback) => {
    connection.on("MessageSent", (payload) => {
        callback(payload);
    });
};

export const onError = (callback) => {
    connection.on("Error", (message) => {
        callback(message);
    });
};