using System;

namespace MeetVerse.Shared.DTOs.Profile;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = default!;
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
    public string Roles { get; set; } = default!;
    public bool IsGoogleUser { get; set; }
}
