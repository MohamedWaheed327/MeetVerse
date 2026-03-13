using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Data;
using MeetVerse.Api.Dtos;
using MeetVerse.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Runtime.CompilerServices;

namespace MeetVerse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly MeetVerseDbContext _db;

    public ProfileController(MeetVerseDbContext db)
    {
        _db = db;
    }

    [HttpGet("me")]
    public async Task<User> GetCurrentUser()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid id = Guid.Parse(sub!);
        return (await _db.Users.FirstOrDefaultAsync(user => user.Id == id))!;
    }

    // change password
    [HttpPut("/change/password")]
    public async Task ChangePassword()
    {
        
    }
    // delete account

    // change name

    // change avatar     
}