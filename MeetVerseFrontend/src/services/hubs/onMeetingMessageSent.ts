import { meeting_chat_connection } from "./connections";

export const onMeetingMessageSent = (callback: ({ user, message }: { user: string, message: string }) => void) => {
    meeting_chat_connection.on("MessageSent", (user: string, message: string) => {
        callback({ user, message });
    });
};