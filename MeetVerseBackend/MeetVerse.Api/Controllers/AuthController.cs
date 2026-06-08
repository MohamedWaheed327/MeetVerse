using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Database;
using MeetVerse.Api.Dtos;
using MeetVerse.Api.Models;
using MeetVerse.Api.Services;
using MeetVerse.Api.Services.Background;

namespace MeetVerse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private void JoinGlobalGroup(Guid newUserId)
    {
        const string GlobalGroupId = "11111111-1111-1111-1111-111111111111";
        _db.UserGroups.Add(new UserGroup
        {
            UserId = newUserId,
            GroupId = new Guid(GlobalGroupId),
            Role = GroupMemberRole.Member,
            JoinedAt = DateTime.UtcNow
        });
    }

    private readonly MeetVerseDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public AuthController(
        MeetVerseDbContext db,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IConfiguration configuration)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _configuration = configuration;
        // GitHub OAuth removed
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        CustomLogger.Log($"{request.Name} ({request.Email}) tried to register.");
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest("Email already in use");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Name = request.Name,
            Roles = request.Role
        };
        CustomLogger.Log($"{request.Name} ({request.Email}) registered.");
        _db.Users.Add(user);
        JoinGlobalGroup(user.Id);
        await _db.SaveChangesAsync();

        var token = _tokenService.GenerateAccessToken(user);
        return new AuthResponse { Token = token };
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        CustomLogger.Log($"{request.Email} tried to login.");
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null)
        {
            CustomLogger.Log($"{request.Email} failed to login.");
            return Unauthorized();
        }

        if (!_passwordHasher.Verify(user.PasswordHash, request.Password))
        {
            CustomLogger.Log($"{request.Email} failed to login.");
            return Unauthorized();
        }

        CustomLogger.Log($"{user.Name} ({user.Email}) logined successfully.");
        var token = _tokenService.GenerateAccessToken(user);
        return new AuthResponse { Token = token };
    }

    [HttpPost("google-login")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin(GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            return BadRequest("Google token is required");
        }

        var clientId = _configuration["GoogleAuth:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return Problem("Google authentication is not configured on the server.");
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId]
            });
        }
        catch
        {
            return Unauthorized("Invalid Google token");
        }

        if (!payload.EmailVerified)
        {
            return Unauthorized("Google account email is not verified");
        }

        var email = payload.Email;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = string.Empty,
                Name = payload.Name,
                AvatarUrl = payload.Picture,
                Roles = UserRole.User
            };

            _db.Users.Add(user);
            JoinGlobalGroup(user.Id);
            await _db.SaveChangesAsync();
            CustomLogger.Log($"{user.Name} ({user.Email}) registered with Google.");
        }
        else
        {
            if (string.IsNullOrWhiteSpace(user.Name) && !string.IsNullOrWhiteSpace(payload.Name))
            {
                user.Name = payload.Name;
            }

            if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(payload.Picture))
            {
                user.AvatarUrl = payload.Picture;
            }

            await _db.SaveChangesAsync();
        }

        var token = _tokenService.GenerateAccessToken(user);
        return new AuthResponse { Token = token };
    }

    // GitHub login endpoint removed; only Google login retained.
}


