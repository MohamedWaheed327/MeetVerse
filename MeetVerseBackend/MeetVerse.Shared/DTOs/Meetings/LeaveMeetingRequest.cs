namespace MeetVerse.Shared.DTOs.Meetings;

public class LeaveMeetingRequest
{
    public Guid MeetingId { get; set; }
    public bool EndMeetingForAll { get; set; } = false;
}
