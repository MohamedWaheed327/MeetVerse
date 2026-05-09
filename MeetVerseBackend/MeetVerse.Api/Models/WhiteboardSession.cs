namespace MeetVerse.Api.Models;

public class WhiteboardSession
{
    public Guid Id { get; set; }

    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = default!;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }

    /// <summary>Miro board ID linked to this session.</summary>
    public string? MiroBoardId { get; set; }

    /// <summary>Miro board view/embed URL.</summary>
    public string? MiroBoardViewUrl { get; set; }

    public ICollection<WhiteboardEvent> Events { get; set; } = new List<WhiteboardEvent>();
}

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


