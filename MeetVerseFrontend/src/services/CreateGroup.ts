import api from "./api";

export const createGroup = async (name: string, description: string, isPublic: boolean, coverGradient: string) => {
    try {
        const response = await api.post("/groups", { name, description, isPublic, coverGradient });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};