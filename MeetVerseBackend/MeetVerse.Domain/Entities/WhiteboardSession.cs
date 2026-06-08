namespace MeetVerse.Domain.Entities;

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
