import api from './api'

export async function requestJoinGroup(groupId: string) {
    try {
        var response = await api.post(`groups/${groupId}/requests`);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Network error");
        }
    }
}