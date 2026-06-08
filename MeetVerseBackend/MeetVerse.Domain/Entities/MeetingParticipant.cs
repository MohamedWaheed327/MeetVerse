using MeetVerse.Domain.Enums;

namespace MeetVerse.Domain.Entities;

public class MeetingParticipant
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public MeetingParticipantRole Role { get; set; } = MeetingParticipantRole.Participant;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LeftAt { get; set; }

    public bool IsActive { get; set; }
}
