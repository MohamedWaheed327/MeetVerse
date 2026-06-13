import api from "./api";

export const getMeetingHistory = async () => {
    try {
        const response = await api.get("/meetings/history");
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};
