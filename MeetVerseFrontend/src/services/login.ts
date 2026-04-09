import api from "./api";

export const loginUser = async (data: {email: string, password: string}) => {
    try {
        const response = await api.post("/auth/login", data);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};