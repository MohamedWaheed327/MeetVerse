using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Persistence.Data;
using MeetVerse.Domain.Entities;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Shared.DTOs.Auth;
using MeetVerse.Shared.DTOs.Profile;

namespace MeetVerse.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly MeetVerseDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public ProfileController(MeetVerseDbContext db, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<User>> GetCurrentUser()
    {
        var userId = GetUserId();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound("User not found.");
        return Ok(user);
    }

    [HttpPut("password")]
    public async Task<ActionResult<AuthResponse>> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");
        if (!_passwordHasher.Verify(user.PasswordHash, request.OldPassword))
            return BadRequest("Invalid current password.");
        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        await _db.SaveChangesAsync();
        var token = _tokenService.GenerateAccessToken(user);
        return new AuthResponse { Token = token };
    }

    [HttpPut("name")]
    public async Task<IActionResult> ChangeName([FromBody] ChangeNameDto request)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");
        user.Name = request.NewName;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Name updated successfully.", name = user.Name });
    }

    [HttpPut("avatar")]
    public async Task<IActionResult> ChangeAvatar([FromBody] ChangeAvatarDto request)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");
        user.AvatarUrl = request.NewAvatarUrl;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Avatar updated successfully.", avatarUrl = user.AvatarUrl });
    }

    [HttpDelete("account")]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");
        try
        {
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest("Cannot delete account because it is tied to existing meetings or groups.");
        }
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(sub!);
    }
}
