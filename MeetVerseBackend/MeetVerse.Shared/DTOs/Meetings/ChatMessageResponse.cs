namespace MeetVerse.Shared.DTOs.Meetings;

public class ChatMessageResponse
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = default!;
    public string Content { get; set; } = default!;
    public DateTime SentAt { get; set; }
}
