using System.Security.Cryptography;
using System.Text;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Domain.Entities;
using MeetVerse.Persistence.Data;
using MeetVerse.Services.Implementations.Logging;
using Microsoft.EntityFrameworkCore;

namespace MeetVerse.Services.Implementations.Auth;

public class PasswordResetService : IPasswordResetService
{
    private const int CodeLength = 6;
    private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(15);

    private readonly MeetVerseDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public PasswordResetService(MeetVerseDbContext db, IPasswordHasher passwordHasher, IEmailService emailService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
    }

    public async Task RequestResetAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        CustomLogger.Log($"[PasswordReset] RequestResetAsync called for: '{normalizedEmail}'");

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            CustomLogger.Log("[PasswordReset] Email is empty after normalization — returning.");
            return;
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (user is null)
        {
            CustomLogger.Log($"[PasswordReset] No user found for '{normalizedEmail}' — returning.");
            return;
        }

        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            CustomLogger.Log($"[PasswordReset] User '{normalizedEmail}' has empty PasswordHash (Google-only) — returning.");
            return;
        }

        CustomLogger.Log($"[PasswordReset] User found: {user.Name} ({user.Email}). Generating OTP...");

        var code = GenerateCode();
        var codeHash = HashCode(normalizedEmail, code);
        var now = DateTime.UtcNow;

        var activeRequests = await _db.PasswordResetRequests
            .Where(r => r.Email == normalizedEmail && !r.IsUsed && r.ExpiresAtUtc > now)
            .ToListAsync(cancellationToken);

        foreach (var request in activeRequests)
            request.IsUsed = true;

        _db.PasswordResetRequests.Add(new PasswordResetRequest
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            CodeHash = codeHash,
            ExpiresAtUtc = now.Add(CodeLifetime),
            CreatedAtUtc = now,
            IsUsed = false
        });

        await _db.SaveChangesAsync(cancellationToken);

        // Send the OTP email via Resend
        var userName = user.Name ?? "User";
        var htmlBody = BuildOtpEmailHtml(userName, code, (int)CodeLifetime.TotalMinutes);

        try
        {
            await _emailService.SendAsync(
                normalizedEmail,
                $"MeetVerse — Your Password Reset Code: {code}",
                htmlBody,
                cancellationToken);
        }
        catch (Exception ex)
        {
            CustomLogger.Log($"Failed to send OTP email to {normalizedEmail}: {ex.Message}");
            // Don't rethrow — the code is saved in DB; user can retry.
        }

        CustomLogger.Log(
            $"Password reset code for {normalizedEmail}: {code} (valid for {CodeLifetime.TotalMinutes} minutes)");
    }

    private static string BuildOtpEmailHtml(string userName, string code, int validMinutes)
    {
        var digits = string.Join("", code.Select(c =>
            $"<span style=\"display:inline-block;width:42px;height:50px;line-height:50px;text-align:center;" +
            $"font-size:26px;font-weight:700;color:#ffffff;background:#4F46E5;border-radius:10px;" +
            $"margin:0 3px;font-family:'Segoe UI',Arial,sans-serif;\">{c}</span>"));

        return $@"
<div style=""font-family:'Segoe UI',Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;background:#0D0F16;border-radius:20px;overflow:hidden;border:1px solid #2A2E3B;"">
  <div style=""background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:32px 24px;text-align:center;"">
    <h1 style=""margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;"">MeetVerse</h1>
    <p style=""margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;"">Password Reset Request</p>
  </div>
  <div style=""padding:36px 32px;"">
    <p style=""color:#F1F5F9;font-size:16px;margin:0 0 8px;"">Hi <strong>{userName}</strong>,</p>
    <p style=""color:#A8B0C2;font-size:14px;line-height:1.6;margin:0 0 28px;"">
      We received a request to reset your password. Use the verification code below to proceed. This code is valid for <strong style=""color:#F1F5F9;"">{validMinutes} minutes</strong>.
    </p>
    <div style=""text-align:center;margin:0 0 28px;"">
      {digits}
    </div>
    <p style=""color:#A8B0C2;font-size:13px;line-height:1.5;margin:0 0 20px;"">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
    <hr style=""border:none;border-top:1px solid #2A2E3B;margin:24px 0;""/>
    <p style=""color:#6B7280;font-size:11px;text-align:center;margin:0;"">
      &copy; {DateTime.UtcNow.Year} MeetVerse &mdash; Collaborative meetings, reimagined.
    </p>
  </div>
</div>";
    }

    public async Task<bool> VerifyCodeAsync(string email, string code, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(code))
            return false;

        var request = await FindValidRequestAsync(normalizedEmail, code, cancellationToken);
        return request is not null;
    }

    public async Task ResetPasswordAsync(
        string email,
        string code,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
            throw new InvalidOperationException("Invalid email address.");

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
            throw new InvalidOperationException("Password must be at least 6 characters.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user is null)
            throw new InvalidOperationException("Invalid or expired reset code.");

        if (string.IsNullOrEmpty(user.PasswordHash))
            throw new InvalidOperationException("This account uses Google sign-in. Please continue with Google.");

        var request = await FindValidRequestAsync(normalizedEmail, code, cancellationToken);
        if (request is null)
            throw new InvalidOperationException("Invalid or expired reset code.");

        user.PasswordHash = _passwordHasher.Hash(newPassword);
        request.IsUsed = true;

        var otherActive = await _db.PasswordResetRequests
            .Where(r => r.Email == normalizedEmail && !r.IsUsed && r.Id != request.Id)
            .ToListAsync(cancellationToken);

        foreach (var other in otherActive)
            other.IsUsed = true;

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<PasswordResetRequest?> FindValidRequestAsync(
        string normalizedEmail,
        string code,
        CancellationToken cancellationToken)
    {
        var codeHash = HashCode(normalizedEmail, code.Trim());
        var now = DateTime.UtcNow;

        return await _db.PasswordResetRequests
            .Where(r =>
                r.Email == normalizedEmail &&
                !r.IsUsed &&
                r.ExpiresAtUtc > now &&
                r.CodeHash == codeHash)
            .OrderByDescending(r => r.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    private static string GenerateCode() =>
        Random.Shared.Next(0, 1_000_000).ToString($"D{CodeLength}");

    private static string HashCode(string email, string code)
    {
        var payload = $"{email}:{code.Trim()}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash);
    }
}
