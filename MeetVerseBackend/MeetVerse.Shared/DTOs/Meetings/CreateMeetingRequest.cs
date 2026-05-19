namespace MeetVerse.Shared.DTOs.Meetings;

public class CreateMeetingRequest
{
    public const string GlobalGroupId = "11111111-1111-1111-1111-111111111111";
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public Guid? GroupId { get; set; } = new Guid(GlobalGroupId);
}
