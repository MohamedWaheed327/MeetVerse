namespace MeetVerse.Shared.DTOs.Meetings;

public class CreateMeetingRequest
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public Guid? GroupId { get; set; }
    public bool SecurePassword { get; set; }
    public string? Password { get; set; }
}
