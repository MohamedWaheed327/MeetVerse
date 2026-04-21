namespace MeetVerse.Api.Models;

public class JoinGroupRequest
{
    public Guid Id { get; set; }

    public Guid GroupId { get; set; }
    public Group Group { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
}