import api from "../../../services/api";
import { getCurrentUser } from "../../../services/currentUser";

export async function getLivekitToken(meetingId: string, displayName: string) {
    const currentUser = await getCurrentUser();
    const response = await api.get("/livekit/token", {
        params: {
            username: `user_${currentUser.id}`,
            room: meetingId,
            displayName: (displayName as string) ?? currentUser.name,
            avatar: currentUser.avatarUrl,
        },
    });
    const token = response.data.token;
    return token;
}