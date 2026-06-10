namespace MeetVerse.Domain.Entities;

public class PasswordResetRequest
{
    public Guid Id { get; set; }
    public string Email { get; set; } = default!;
    public string CodeHash { get; set; } = default!;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsUsed { get; set; }
}
