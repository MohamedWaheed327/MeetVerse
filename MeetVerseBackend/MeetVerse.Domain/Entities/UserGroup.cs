using MeetVerse.Domain.Enums;

namespace MeetVerse.Domain.Entities;

public class UserGroup
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public Guid GroupId { get; set; }
    public Group Group { get; set; } = default!;

    public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
