import api from './api'

export async function requestJoinGroup(groupId: string) {
    try {
        var response = await api.post(`groups/${groupId}/requests`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            const data = error.response.data;
            let errorMessage = "Failed to join";
            if (typeof data === 'string') {
                errorMessage = data;
            } else if (data.message) {
                errorMessage = data.message;
            } else if (data.detail) {
                errorMessage = data.detail;
            } else if (data.title) {
                errorMessage = data.title;
            }
            throw new Error(errorMessage);
        } else if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Network error");
        }
    }
}