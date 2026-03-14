using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Data;
using MeetVerse.Api.Dtos;
using MeetVerse.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace MeetVerse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly MeetVerseDbContext _db;

    public MeetingsController(MeetVerseDbContext db)
    {
        _db = db;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    public async Task<Meeting> CreateMeeting(CreateMeetingRequest creatMeetingRequest)
    {
        var userId = GetCurrentUserId();

        Meeting meeting = new Meeting
        {
            Id = Guid.NewGuid(),
            HostId = userId!.Value,
            Host = (await _db.Users.FirstOrDefaultAsync(user => user.Id == userId))!,

            GroupId = creatMeetingRequest.GroupId,
            Group = (await _db.Groups.FirstOrDefaultAsync(group => group.Id == creatMeetingRequest.GroupId))!,

            Title = creatMeetingRequest.Title,
            Description = creatMeetingRequest.Description,
            ScheduledStart = creatMeetingRequest.ScheduledStart,
            ScheduledEnd = creatMeetingRequest.ScheduledEnd,
        };
        _db.Meetings.Add(meeting);
        return meeting;
    }

    public async Task<MeetingParticipant> JoinMeeting(JoinMeetingRequest joinMeetingRequest)
    {
        var userId = GetCurrentUserId();
        var meetingId = joinMeetingRequest.Id;
        var meeting = await _db.Meetings.FirstOrDefaultAsync(meeting => meeting.Id == meetingId);

        return new MeetingParticipant();
    }
}