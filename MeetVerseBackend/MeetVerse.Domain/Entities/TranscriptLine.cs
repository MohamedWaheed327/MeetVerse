namespace MeetVerse.Domain.Entities;

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
