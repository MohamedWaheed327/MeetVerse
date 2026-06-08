namespace MeetVerse.Shared.DTOs.Whiteboard;

public class WhiteboardSessionResponse
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int EventCount { get; set; }
    public string? MiroBoardUrl { get; set; }
}
