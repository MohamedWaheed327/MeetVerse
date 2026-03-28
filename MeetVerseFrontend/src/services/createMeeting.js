import api from "./api";

export const createMeeting = async (data) => {
    try {
        console.log("Meeting Data:", data);
        const response = await api.post("/meetings/create", data);
        return response.data;
    } catch (error) {
        alert(error.message);
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};