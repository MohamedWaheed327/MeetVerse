import api from "./api";

type MeetingCreateData = {
    title: string;
    date: string;
    time: string;
    scheduledStart: string;
};

export const createMeeting = async (data: MeetingCreateData) => {
    try {
        console.log("Meeting Data:", data);
        const response = await api.post("/meetings/create", data);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};