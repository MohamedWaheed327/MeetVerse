namespace MeetVerse.Api.Models;

public class Recording
{
    public Guid Id { get; set; }

    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = default!;

    public string FilePath { get; set; } = default!;
    public double DurationSeconds { get; set; }
    public int SampleRate { get; set; }
    public long SizeBytes { get; set; }
    public bool IsNoiseCleaned { get; set; }

    public double? AverageNoiseLevel { get; set; }
    public string Status { get; set; } = "Pending"; // Pending / Finished

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Transcript? Transcript { get; set; }
}


