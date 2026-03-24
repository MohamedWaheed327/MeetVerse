import api from "./api";


export const joinMeeting = async (data) => {
    try {
        const response = await api.post("/meetings/join", data);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};