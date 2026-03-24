import api from "./api";

export const leaveMeeting = async (data) => {
    try {
        const response = await api.post("/meetings/leave", data);
        return response.data;
    } catch (error) {
        // alert(error.response.data);
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};