import api from "./api";

export const getActiveMeetings = async () => {
    try {
        const response = await api.get("/meetings/active-meetings");
        const now = new Date(); // Current time
        const processedData = response.data.map(meeting => ({
            ...meeting,
            isLive: new Date(meeting.scheduledStart) <= now && (meeting.scheduledEnd == null || new Date(meeting.scheduledEnd) >= now),
            meetingId: meeting.id
        }));

        return processedData;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};