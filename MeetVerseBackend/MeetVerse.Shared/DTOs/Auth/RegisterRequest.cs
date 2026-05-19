using MeetVerse.Domain.Enums;

namespace MeetVerse.Shared.DTOs.Auth;

public class RegisterRequest
{
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
    public string? Name { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
}
