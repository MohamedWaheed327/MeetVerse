namespace MeetVerse.Shared.DTOs.Groups;

public class AddGroupMemberRequest
{
    public string Email { get; set; } = default!;
    public string Role { get; set; } = "member"; // member | admin
}
