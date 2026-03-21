import api from "./api";

export const loginUser = async (data) => {
    try {
        alert(data);
        const response = await api.post("/auth/login", data);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};