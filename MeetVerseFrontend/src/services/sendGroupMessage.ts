import api from "./api";

export const sendGroupMessage = async (groupId: string, content: string) => {
    try {
        const response = await api.post(`/groups/${groupId}/messages`, { content: content });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Network error");
        }
    }
};