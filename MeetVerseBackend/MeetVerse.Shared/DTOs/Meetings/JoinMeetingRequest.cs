namespace MeetVerse.Shared.DTOs.Meetings;

public class JoinMeetingRequest
{
    public Guid MeetingId { get; set; }
    public string? Password { get; set; }
}
