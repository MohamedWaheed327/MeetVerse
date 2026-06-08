import api from "./api";

export const leaveMeetingAPI = async (meetingId: string, endMeetingForAll: boolean) => {
    try {
        const response = await api.post("/meetings/leave", { meetingId, endMeetingForAll });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};
