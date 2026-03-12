namespace MeetVerse.Api.Models;

public class MeetingSummary
{
    public Guid Id { get; set; }

    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = default!;

    public Guid TranscriptId { get; set; }
    public Transcript Transcript { get; set; } = default!;

    public string SummaryText { get; set; } = default!;
    public string? KeyDecisionsJson { get; set; } // JSON array of decisions
    public string? ActionItemsJson { get; set; } // JSON array of action items

    public string GeneratedBy { get; set; } = "gpt-4";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}


