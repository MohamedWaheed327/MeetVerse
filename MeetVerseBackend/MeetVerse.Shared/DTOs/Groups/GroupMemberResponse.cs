namespace MeetVerse.Shared.DTOs.Groups;

public class GroupMemberResponse
{
    public Guid UserId { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = default!;
    public DateTime JoinedAt { get; set; }
}
