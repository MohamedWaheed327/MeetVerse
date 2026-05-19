
namespace MeetVerse.Api.Dtos;

public class CreateMeetingRequest
{
    public const string GlobalGroupId = "11111111-1111-1111-1111-111111111111";
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public Guid? GroupId { get; set; } = new Guid(GlobalGroupId);
}

public class JoinMeetingRequest
{
    public Guid MeetingId { get; set; }
}

public class LeaveMeetingRequest
{
    public Guid MeetingId { get; set; }
    public bool EndMeetingForAll { get; set; } = false;
}

public class ChatMessageResponse
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }

    public Guid SenderId { get; set; }

    public string SenderName { get; set; } = default!;
    public string Content { get; set; } = default!;
    public DateTime SentAt { get; set; }

}