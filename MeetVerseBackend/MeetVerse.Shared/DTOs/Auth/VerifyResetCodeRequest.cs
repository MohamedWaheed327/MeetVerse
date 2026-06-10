namespace MeetVerse.Shared.DTOs.Auth;

public class VerifyResetCodeRequest
{
    public string Email { get; set; } = default!;
    public string Code { get; set; } = default!;
}
