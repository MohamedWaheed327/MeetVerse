namespace MeetVerse.Shared.DTOs.Groups;

public class GroupResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public Guid CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public int MemberCount { get; set; }
    public string? CurrentUserRole { get; set; }
    public string? CoverGradient { get; set; }
    public bool IsPublic { get; set; }
}
