import api from './api'

type GroupRequestsResponse = {
    senderId: string;
    senderName: string;
    senderEmail: string;
    sentAt: string;
};

export async function getJoinGroupRequests(groupId: string) {
    try {
        var response = await api.get(`groups/${groupId}/requests`);
        return response.data as GroupRequestsResponse[];
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Network error");
        }
    }
}