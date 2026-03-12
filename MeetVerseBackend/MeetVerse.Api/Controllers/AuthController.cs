using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Data;
using MeetVerse.Api.Dtos;
using MeetVerse.Api.Models;
using MeetVerse.Api.Services;

namespace MeetVerse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly MeetVerseDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthController(MeetVerseDbContext db, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
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

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenService.GenerateAccessToken(user);
        return new AuthResponse { Token = token };
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null)
        {
            return Unauthorized();
        }

        if (!_passwordHasher.Verify(user.PasswordHash, request.Password))
        {
            return Unauthorized();
        }

        var token = _tokenService.GenerateAccessToken(user);
        return new AuthResponse { Token = token };
    }
}


