using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MediatR;
using AutoMapper;
using MeetVerse.Persistence.Data;
using MeetVerse.Domain.Entities;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Abstraction.Commands;
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
    private readonly IMediator _mediator;
    private readonly IImageResolver _imageResolver;
    private readonly IMapper _mapper;

    public ProfileController(
        MeetVerseDbContext db, 
        IPasswordHasher passwordHasher, 
        ITokenService tokenService,
        IMediator mediator,
        IImageResolver imageResolver,
        IMapper mapper)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _mediator = mediator;
        _imageResolver = imageResolver;
        _mapper = mapper;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetCurrentUser()
    {
        var userId = GetUserId();
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound("User not found.");

        var dto = _mapper.Map<UserProfileDto>(user);
        dto.AvatarUrl = _imageResolver.ResolveAvatarUrl(user.AvatarUrl);
        return Ok(dto);
    }

    [HttpPost("upload-avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file was uploaded.");
        }

        // Validate size (5 megabytes = 5 * 1024 * 1024 bytes)
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest("File size exceeds the 5MB limit.");
        }

        // Validate image type
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest("Invalid image format. Allowed formats: JPEG, PNG, GIF, WEBP.");
        }

        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        // Clean localpart from email for Google OAuth users and standard email users.
        // Rule: convert email local part to lowercase, strip dots, plus signs, and other special characters, keeping only letters, numbers, and hyphens.
        var emailLocalPart = user.Email.Split('@')[0].ToLowerInvariant();
        
        // Strip dots, plus signs, and keep only letters, numbers, hyphens/underscores
        var sb = new System.Text.StringBuilder();
        foreach (var c in emailLocalPart)
        {
            if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' || c == '_')
            {
                sb.Append(c);
            }
        }
        var sanitizedUsername = sb.ToString();

        using (var stream = file.OpenReadStream())
        {
            var command = new UploadAvatarCommand(userId, sanitizedUsername, stream, file.FileName);
            var resultDto = await _mediator.Send(command);
            
            return Ok(new { avatarUrl = resultDto.AvatarUrl });
        }
    }

    [HttpPut("password")]
    public async Task<ActionResult<AuthResponse>> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");
        
        // Google users have empty password hash and shouldn't change password
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            return BadRequest("Google users do not have password credentials.");
        }

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
