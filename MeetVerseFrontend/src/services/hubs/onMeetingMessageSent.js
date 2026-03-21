import connection from "./connections";

export const onMeetingMessageSent = (callback) => {
    connection.on("MessageSent", (user, message) => {
        callback({ user, message });
    });
};