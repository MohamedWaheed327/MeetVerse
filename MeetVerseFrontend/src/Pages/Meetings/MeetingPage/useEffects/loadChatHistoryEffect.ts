import { useEffect } from "react";
import { GetMeetingChat } from "../../../../services/getMeetingChat";

type Message = {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
};

export function loadChatHistoryEffect(meetingId: string | undefined, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const history = await GetMeetingChat({ meetingId: meetingId ?? "" });
                setMessages(history || []);
            } catch (err) {
                console.error("Failed to load chat history:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (meetingId) {
            loadHistory();
        }
    }, [meetingId]);
}