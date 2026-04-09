import connection from "./connections";

export const onMeetingMessageSent = (callback: ({ user, message }: { user: string, message: string }) => void) => {
    connection.on("MessageSent", (user: string, message: string) => {
        callback({ user, message });
    });
};