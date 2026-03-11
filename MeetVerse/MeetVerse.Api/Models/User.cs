namespace MeetVerse.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Roles { get; set; } = UserRole.User;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Meeting> HostedMeetings { get; set; } = new List<Meeting>();
    public ICollection<MeetingParticipant> MeetingParticipants { get; set; } = new List<MeetingParticipant>();

    public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();
    public ICollection<Group> CreatedGroups { get; set; } = new List<Group>();
    public ICollection<GroupMessage> GroupMessagesSent { get; set; } = new List<GroupMessage>();
}


