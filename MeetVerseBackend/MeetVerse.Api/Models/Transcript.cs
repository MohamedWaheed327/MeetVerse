namespace MeetVerse.Api.Models;

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

public class TranscriptLine
{
    public Guid Id { get; set; }

    public Guid TranscriptId { get; set; }
    public Transcript Transcript { get; set; } = default!;

    public double StartTimeSeconds { get; set; }
    public double EndTimeSeconds { get; set; }

    public Guid? SpeakerUserId { get; set; }
    public string? SpeakerLabel { get; set; }

    public string Text { get; set; } = default!;
}


