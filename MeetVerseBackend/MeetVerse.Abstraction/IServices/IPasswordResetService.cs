namespace MeetVerse.Abstraction.IServices;

public interface IPasswordResetService
{
    Task RequestResetAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> VerifyCodeAsync(string email, string code, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(string email, string code, string newPassword, CancellationToken cancellationToken = default);
}
