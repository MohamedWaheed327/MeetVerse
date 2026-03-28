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

    private async Task<IEnumerable<GroupResponse>> GetMyGroups()
    {
        var userId = GetCurrentUserId();
        var groups = await _db.UserGroups
            .Where(ug => ug.UserId == userId || ug.GroupId == new Guid("3fa85f64-5717-4562-b3fc-2c963f66afa6"))
            .Select(ug => new GroupResponse
            {
                Id = ug.Group.Id,
                Name = ug.Group.Name,
                Description = ug.Group.Description,
                CreatedById = ug.Group.CreatedById,
                CreatedByName = ug.Group.CreatedBy.Name,
                CreatedAt = ug.Group.CreatedAt,
                MemberCount = ug.Group.UserGroups.Count,
                CurrentUserRole = ug.Role.ToString()
            })
            .ToListAsync();
        return groups;
    }

    private async Task<IEnumerable<NewClass>> GetGroupMeetings(Guid groupId)
    {
        var userId = GetCurrentUserId();

        var meetings = await _db.Meetings
            .Where(m => m.GroupId == groupId)
            .OrderByDescending(m => m.ScheduledStart)
            .Select(m => new NewClass(
                m.Id,
                m.Title,
                m.Description,
                m.ScheduledStart,
                m.ScheduledEnd,
                m.Status,
                m.CreatedAt,
                m.HostId,
                m.Host.Name
            ))
            .ToListAsync();
        return meetings;
    }

    [HttpGet("live-meetings")]
    public async Task<ActionResult<ICollection<NewClass>>> GetLiveMeetings()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        List<NewClass> meetings = [];
        foreach (var group in await GetMyGroups())
        {
            foreach (var meeting in await GetGroupMeetings(group.Id))
            {
                if (meeting.ScheduledStart <= DateTime.UtcNow && DateTime.UtcNow <= meeting.ScheduledEnd)
                {
                    meetings.Add(meeting);
                }
            }
        }

        return meetings;
    }

    [HttpGet("active-meetings")]
    public async Task<ActionResult<ICollection<NewClass>>> GetActiveMeetings()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        List<NewClass> meetings = [];
        foreach (var group in await GetMyGroups())
        {
            foreach (var meeting in await GetGroupMeetings(group.Id))
            {
                if (meeting.ScheduledEnd.HasValue == false || DateTime.UtcNow < meeting.ScheduledEnd)
                {
                    meetings.Add(meeting);
                }
            }
        }

        return meetings;
    }

    [HttpPost("create")]
    public async Task<ActionResult> CreateMeeting(CreateMeetingRequest creatMeetingRequest)
    {
        System.Console.WriteLine("hiiiiii");
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        User x = (await _db.Users.FirstOrDefaultAsync(user => user.Id == userId!.Value))!;
        Meeting meeting = new Meeting
        {
            Id = Guid.NewGuid(),
            HostId = userId!.Value,
            Host = x,
            GroupId = creatMeetingRequest.GroupId,
            Title = creatMeetingRequest.Title,
            Description = creatMeetingRequest.Description,
            ScheduledStart = creatMeetingRequest.ScheduledStart,
            ScheduledEnd = creatMeetingRequest.ScheduledEnd,
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        return Ok();
    }

    [HttpPost("join")]
    public async Task<ActionResult> JoinMeeting(JoinMeetingRequest joinMeetingRequest)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var meetingId = joinMeetingRequest.MeetingId;
        var meeting = await _db.Meetings.FirstOrDefaultAsync(meeting => meeting.Id == meetingId);
        if (!await IsInGroupAsync(meeting!.GroupId!.Value)) return NotFound();

        var particpant = new MeetingParticipant
        {
            Id = Guid.NewGuid(),
            MeetingId = meetingId,
            Meeting = meeting,
            UserId = userId!.Value,
            Role = userId!.Value == meeting.HostId ? MeetingParticipantRole.Host : MeetingParticipantRole.Participant,
            IsActive = true
        };

        using var transaction = await _db.Database.BeginTransactionAsync();
        if (await _db.MeetingParticipants.AnyAsync(par => par.UserId == userId.Value && par.MeetingId == meetingId))
        {
            return BadRequest();
        }
        else
        {
            await _db.MeetingParticipants.AddAsync(particpant);
            await _db.SaveChangesAsync();
        }
        await transaction.CommitAsync();
        return Ok();
    }

    [HttpPost("leave")]
    public async Task<ActionResult> LeaveMeeting(LeaveMeetingRequest leaveMeetingRequest)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var meetingId = leaveMeetingRequest.MeetingId;
        if ((await _db.MeetingParticipants.Where(par => par.UserId == userId.Value).ToListAsync()).Count == 0)
        {
            return BadRequest();
        }

        var meeting = await _db.Meetings.FirstOrDefaultAsync(meeting => meeting.Id == meetingId);
        if (!await IsInGroupAsync(meeting!.GroupId!.Value)) return NotFound();
        try
        {
            var participants = await _db.MeetingParticipants.Where(p => p.MeetingId == meetingId && p.UserId == userId).ToListAsync();
            _db.MeetingParticipants.RemoveRange(participants);
            await _db.SaveChangesAsync();
        }
        catch
        {

        }
        return Ok();
    }

    [HttpGet("chat")]
    public async Task<ActionResult<IEnumerable<ChatMessageResponse>>> GetChatMessages(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var chat = await _db.ChatMessages.Where(msg => msg.MeetingId == meetingId).Select((chatMessage) => new ChatMessageResponse
        {
            Id = chatMessage.Id,
            MeetingId = chatMessage.MeetingId,
            SenderId = chatMessage.SenderId,
            SenderName = chatMessage.Sender!.Name!,
            Content = chatMessage.Content,
            SentAt = chatMessage.SentAt
        }).OrderBy(cm => cm.SentAt).ToListAsync();

        return Ok(chat);
    }

    [HttpGet("participants")]
    public async Task<ActionResult<IEnumerable<object>>> GetMeetingParticipants(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var participants = await _db.MeetingParticipants.Where(participant => participant.MeetingId == meetingId).Select((participant) => new
        {
            participant.Id,
            participant.MeetingId,
            participant.UserId,
            participant.Role,
            participant.User.Name
        }).ToListAsync();

        return Ok(participants);
    }
}

public class NewClass
{
    public Guid Id { get; }
    public string Title { get; }
    public string? Description { get; }
    public DateTime ScheduledStart { get; }
    public DateTime? ScheduledEnd { get; }
    public MeetingStatus Status { get; }
    public DateTime CreatedAt { get; }
    public Guid HostId { get; }
    public string? HostName { get; }

    public NewClass(Guid id, string title, string? description, DateTime scheduledStart, DateTime? scheduledEnd, MeetingStatus status, DateTime createdAt, Guid hostId, string? hostName)
    {
        Id = id;
        Title = title;
        Description = description;
        ScheduledStart = scheduledStart;
        ScheduledEnd = scheduledEnd;
        Status = status;
        CreatedAt = createdAt;
        HostId = hostId;
        HostName = hostName;
    }

    public override bool Equals(object? obj)
    {
        return obj is NewClass other &&
               Id.Equals(other.Id) &&
               Title == other.Title &&
               Description == other.Description &&
               ScheduledStart == other.ScheduledStart &&
               ScheduledEnd == other.ScheduledEnd &&
               Status == other.Status &&
               CreatedAt == other.CreatedAt &&
               HostId.Equals(other.HostId) &&
               HostName == other.HostName;
    }

    public override int GetHashCode()
    {
        HashCode hash = new HashCode();
        hash.Add(Id);
        hash.Add(Title);
        hash.Add(Description);
        hash.Add(ScheduledStart);
        hash.Add(ScheduledEnd);
        hash.Add(Status);
        hash.Add(CreatedAt);
        hash.Add(HostId);
        hash.Add(HostName);
        return hash.ToHashCode();
    }
}