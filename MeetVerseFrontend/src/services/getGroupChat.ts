import api from "./api";

export const GetGroupChat = async (GroupId: string) => {
    try {
        const response = await api.get(`/Groups/${GroupId}/messages`);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};