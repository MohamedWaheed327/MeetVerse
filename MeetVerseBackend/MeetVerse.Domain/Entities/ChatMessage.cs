namespace MeetVerse.Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; set; }

    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = default!;

    public Guid SenderId { get; set; }
    public User Sender { get; set; } = default!;

    public string Content { get; set; } = default!;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
