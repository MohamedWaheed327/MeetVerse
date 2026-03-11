namespace MeetVerse.Api.Models;

public class GroupMessage
{
    public Guid Id { get; set; }

    public Guid GroupId { get; set; }
    public Group Group { get; set; } = default!;

    public Guid SenderId { get; set; }
    public User Sender { get; set; } = default!;

    public string Content { get; set; } = default!;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime? EditedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
