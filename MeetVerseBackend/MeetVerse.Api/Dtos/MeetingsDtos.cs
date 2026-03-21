
namespace MeetVerse.Api.Dtos;

public class CreateMeetingRequest
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public Guid? GroupId { get; set; } = new Guid("A6612E28-2D94-49E0-9486-CFAB4A141D0C");
}

public class JoinMeetingRequest
{
    public Guid MeetingId { get; set; }
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