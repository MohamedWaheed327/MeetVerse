import { sendChatMessage } from "../../../../services/hubs/sendMeetingMessage";

export const handleSendMessage = async (newMessage: string, meetingId: string | undefined, setNewMessage: (value: React.SetStateAction<string>) => void) => {
    if (!newMessage.trim()) return;

    try {
        await sendChatMessage(meetingId ?? "", newMessage.trim());
        setNewMessage("");
    } catch (err) {
        console.error("Send failed:", err);
    }
};