namespace MeetVerse.Api.Dtos;

public class ChangePasswordDto
{
    public string OldPassword { get; set; } = default!;
    public string NewPassword { get; set; } = default!;
}

public class ChangeNameDto
{
    public string NewName { get; set; } = default!;
}

public class ChangeAvatarDto
{
    public string NewAvatarUrl { get; set; } = default!;
}