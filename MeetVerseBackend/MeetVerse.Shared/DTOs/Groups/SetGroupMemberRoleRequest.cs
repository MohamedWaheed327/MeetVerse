namespace MeetVerse.Shared.DTOs.Groups;

public class SetGroupMemberRoleRequest
{
    public string Role { get; set; } = default!; // member | admin | owner
}
