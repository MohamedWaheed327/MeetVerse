import api from "./api";

export const GetMeetingChat = async (data: { meetingId: string }) => {
    try {
        const response = await api.get("/meetings/chat", {
            params: {
                meetingId: data.meetingId
            }
        });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};