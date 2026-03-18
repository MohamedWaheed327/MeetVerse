using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Data;
using MeetVerse.Api.Models;
using MeetVerse.Api.Services.Background;
using MeetVerse.Api.Dtos;

namespace MeetVerse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly MeetVerseDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    // Injected IPasswordHasher here
    public ProfileController(MeetVerseDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    [HttpGet("me")]
    public async Task<ActionResult<User>> GetCurrentUser()
    {
        var userId = GetUserId();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound("User not found.");

        return Ok(user);
    }

    // Change password
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);

        if (user == null) return NotFound("User not found.");

        if (!_passwordHasher.Verify(user.PasswordHash, request.OldPassword))
        {
            return BadRequest("Invalid current password.");
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Password updated successfully." });
    }

    // Change name
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

    // Change avatar     
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

    // Delete account
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
            return BadRequest("Cannot delete account because it is tied to existing meetings or groups. Please leave groups/meetings first or contact support.");
        }
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(sub!);
    }
}
