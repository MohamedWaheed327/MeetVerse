import api from "./api";

export const getMyGroups = async () => {
    try {
        const response = await api.get("/groups");
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw Error(error.message);
        } else {
            throw Error("Network error");
        }
    }
};