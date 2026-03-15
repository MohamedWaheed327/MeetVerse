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

    private async Task<bool> IsInGroupAsync(Guid groupId)
    {
        var userId = GetCurrentUserId();
        var userGroup = await _db.UserGroups.FirstOrDefaultAsync(UserGroup => userId == UserGroup.UserId && groupId == UserGroup.GroupId);
        return userGroup != null;
    }



    // public async Task<ICollection<Meeting>> GetLiveMeeting()
    // {
    //     var userId = GetCurrentUserId();
    //     foreach (var group in _db.Groups.Where(group => group.Id))
    //     {

    //     }
    //     var liveMeetings = _db.Meetings.Where(meeting => meeting)
    // }

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

    public async Task<ActionResult<MeetingParticipant>> JoinMeeting(JoinMeetingRequest joinMeetingRequest)
    {
        var userId = GetCurrentUserId();
        var meetingId = joinMeetingRequest.MeetingId;
        var meeting = await _db.Meetings.FirstOrDefaultAsync(meeting => meeting.Id == meetingId);
        var group = meeting!.Group;
        if (!await IsInGroupAsync(group!.Id)) return NotFound();

        var particpant = new MeetingParticipant
        {
            Id = Guid.NewGuid(),
            MeetingId = meetingId,
            Meeting = meeting,
            UserId = userId!.Value,
            Role = userId!.Value == meeting.HostId ? MeetingParticipantRole.Host : MeetingParticipantRole.Participant,
            IsActive = true
        };
        _db.MeetingParticipants.Add(particpant);
        return particpant;
    }
}