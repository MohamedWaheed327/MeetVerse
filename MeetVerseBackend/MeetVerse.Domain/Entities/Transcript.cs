namespace MeetVerse.Domain.Entities;

public class Transcript
{
    public Guid Id { get; set; }

    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = default!;

    public Guid RecordingId { get; set; }
    public Recording Recording { get; set; } = default!;

    public string Provider { get; set; } = default!; // whisper/assemblyai
    public string? Language { get; set; }
    public string Status { get; set; } = "pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TranscriptLine> Lines { get; set; } = new List<TranscriptLine>();
    public MeetingSummary? MeetingSummary { get; set; }
}
