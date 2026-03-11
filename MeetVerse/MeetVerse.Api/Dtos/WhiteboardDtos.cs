namespace MeetVerse.Api.Dtos;

public class WhiteboardSessionResponse
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int EventCount { get; set; }
}

public class WhiteboardEventResponse
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid UserId { get; set; }
    public string? UserName { get; set; }
    public string Type { get; set; } = default!;
    public string PayloadJson { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
}
