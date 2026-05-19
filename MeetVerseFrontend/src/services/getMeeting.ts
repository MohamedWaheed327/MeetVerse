import api from "./api";

export const getMeeting = async (meetingId: string) => {
    try {
        const response = await api.get(`/Meetings/participants?meetingId=${meetingId}`);
        // This endpoint returns participants, but we might need the meeting itself to know the host.
        // Looking at MeetingsController, there isn't a direct "GetMeeting" by ID that returns MeetingResponse.
        // Wait, MeetingsController.cs doesn't have a GetMeeting(Guid id) endpoint!
        
        // I'll check if I can use GetActiveMeetings and filter.
        const activeMeetings = await api.get("/Meetings/active-meetings");
        return activeMeetings.data.find((m: any) => m.id === meetingId);
    } catch (error) {
        console.error("Error fetching meeting:", error);
        return null;
    }
};
