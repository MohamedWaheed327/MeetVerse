using MeetVerse.Domain.Enums;

namespace MeetVerse.Domain.Entities;

public class Meeting
{
    public Guid Id { get; set; }
    public Guid HostId { get; set; }
    public User Host { get; set; } = default!;

    public Guid? GroupId { get; set; }
    public Group? Group { get; set; }

    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }

    public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MeetingParticipant> Participants { get; set; } = new List<MeetingParticipant>();
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public ICollection<WhiteboardSession> WhiteboardSessions { get; set; } = new List<WhiteboardSession>();
    public ICollection<Recording> Recordings { get; set; } = new List<Recording>();
    public ICollection<EngagementMetric> EngagementMetrics { get; set; } = new List<EngagementMetric>();
    public Transcript? Transcript { get; set; }
    public MeetingSummary? MeetingSummary { get; set; }
}
