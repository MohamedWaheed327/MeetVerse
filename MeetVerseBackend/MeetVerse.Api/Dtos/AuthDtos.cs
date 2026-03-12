using MeetVerse.Api.Models;

namespace MeetVerse.Api.Dtos;

public class RegisterRequest
{
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
    public string? Name { get; set; }
    public UserRole Role { get; set; } = UserRole.Participant;
}

public class LoginRequest
{
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class AuthResponse
{
    public string Token { get; set; } = default!;
}


