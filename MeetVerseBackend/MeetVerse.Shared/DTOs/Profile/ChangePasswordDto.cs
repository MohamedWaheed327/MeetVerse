namespace MeetVerse.Shared.DTOs.Profile;

public class ChangePasswordDto
{
    public string OldPassword { get; set; } = default!;
    public string NewPassword { get; set; } = default!;
}
