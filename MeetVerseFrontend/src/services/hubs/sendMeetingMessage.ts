// sendChatMessage.js
import { meeting_chat_connection } from "./connections";

export const sendChatMessage = async (meetingId: string, content: string) => {
    try {
        await meeting_chat_connection.invoke("SendMessage", meetingId, content);
    } catch (error) {
        throw error;
    }
};