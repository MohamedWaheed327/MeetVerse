namespace MeetVerse.Domain.Entities;

public class WhiteboardEvent
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }
    public WhiteboardSession Session { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Type { get; set; } = default!; // draw/erase/move
    public string PayloadJson { get; set; } = default!; // serialized stroke data
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
