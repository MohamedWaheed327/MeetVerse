import api from "./api";

export interface WhiteboardSessionResponse {
    id: string;
    meetingId: string;
    startedAt: string;
    endedAt: string | null;
    eventCount: number;
    miroBoardUrl?: string;
}

export const getOrCreateWhiteboardSession = async (meetingId: string): Promise<WhiteboardSessionResponse> => {
    try {
        const response = await api.get(`/meetings/${meetingId}/whiteboard`);
        return response.data;
    } catch (error) {
        console.error("Error fetching whiteboard session:", error);
        throw error;
    }
};

export const endWhiteboardSession = async (meetingId: string): Promise<void> => {
    try {
        await api.post(`/meetings/${meetingId}/whiteboard/end`);
    } catch (error) {
        console.error("Error ending whiteboard session:", error);
        throw error;
    }
};
