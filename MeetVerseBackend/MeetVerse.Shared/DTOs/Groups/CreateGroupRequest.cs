namespace MeetVerse.Shared.DTOs.Groups;

public class CreateGroupRequest
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string? CoverColor { get; set; }
    public bool IsPublic { get; set; }
}
