namespace MeetVerse.Domain.Entities;

public class Group
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();
    public ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
    public ICollection<GroupMessage> Messages { get; set; } = new List<GroupMessage>();
    public ICollection<JoinGroupRequest> JoinGroupRequests { get; set; } = new List<JoinGroupRequest>();
}
