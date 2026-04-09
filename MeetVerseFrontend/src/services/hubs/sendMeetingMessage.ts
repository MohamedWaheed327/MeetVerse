// sendChatMessage.js
import connection from "./connections";

export const sendChatMessage = async (meetingId: string, content: string) => {
    try {
        await connection.invoke("SendMessage", meetingId, content);
    } catch (error) {
        throw error;
    }
};