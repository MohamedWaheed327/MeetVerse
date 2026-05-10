import api from './api'

export async function requestJoinGroup(groupId: string) {
    try {
        var response = await api.post(`groups/${groupId}/requests`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(typeof error.response.data === 'string' ? error.response.data : error.response.data.message || "Failed to join");
        } else if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Network error");
        }
    }
}