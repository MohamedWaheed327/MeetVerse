import api from "./api";

export const GetMeetingChat = async (data) => {
    try {
        const response = await api.get("/meetings/chat", {
            params: {
                meetingId: data.meetingId
            }
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};