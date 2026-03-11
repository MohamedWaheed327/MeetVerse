namespace MeetVerse.Api.Models;

public class EngagementMetric
{
    public Guid Id { get; set; }

    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public double TotalSpeakingTimeSeconds { get; set; }
    public int MessagesSent { get; set; }
    public int ReactionsCount { get; set; }
    public int HandRaises { get; set; }
    public double ScreenShareDurationSeconds { get; set; }

    public DateTime? LastActiveAt { get; set; }
}


