using MeetVerse.Domain.Enums;

namespace MeetVerse.Shared.DTOs.Meetings;

/// <summary>
/// Response DTO for meeting data. Replaces the formerly-named 'NewClass'.
/// </summary>
public class MeetingResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public MeetingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid HostId { get; set; }
    public string? HostName { get; set; }
}
