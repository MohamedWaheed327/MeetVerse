import api from "./api";

export type MeetingParticipant = {
    id: string;
    meetingId: string;
    userId: string;
    role: number;
    name: string;
};

export const getMeetingParticipants = async (meetingId: string): Promise<MeetingParticipant[]> => {
    try {
        const response = await api.get(`/meetings/participants?meetingId=${meetingId}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Failed to fetch meeting participants:", error);
        return [];
    }
};
