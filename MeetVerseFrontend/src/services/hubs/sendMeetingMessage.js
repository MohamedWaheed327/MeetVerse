// sendChatMessage.js
import connection from "./connections";

export const sendChatMessage = async (meetingId, content) => {
    try {
        await connection.invoke("SendMessage", meetingId, content);
    } catch (error) {
        throw error;
    }
};