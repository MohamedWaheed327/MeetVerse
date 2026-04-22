import api from './api'

export async function acceptJoinGroupRequest(groupId: string, requesterId: string) {
    try {
        var response = await api.post(`groups/${groupId}/request/${requesterId}/accept`);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Network error");
        }
    }
}