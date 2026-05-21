using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Persistence.Data;
using MeetVerse.Shared.DTOs.Groups;
using MeetVerse.Shared.DTOs.Meetings;
using MeetVerse.Domain.Entities;
using MeetVerse.Domain.Enums;

namespace MeetVerse.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly MeetVerseDbContext _db;

    public MeetingsController(MeetVerseDbContext db) { _db = db; }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task<bool> IsInGroupAsync(Guid groupId)
    {
        var userId = GetCurrentUserId();
        var userGroup = await _db.UserGroups.FirstOrDefaultAsync(ug => userId == ug.UserId && groupId == ug.GroupId);
        return userGroup != null;
    }

    private async Task<IEnumerable<GroupResponse>> GetMyGroupsInternal()
    {
        var userId = GetCurrentUserId();
        return await _db.UserGroups
            .Where(ug => ug.UserId == userId || ug.GroupId == new Guid("3fa85f64-5717-4562-b3fc-2c963f66afa6"))
            .Select(ug => new GroupResponse
            {
                Id = ug.Group.Id, Name = ug.Group.Name, Description = ug.Group.Description,
                CreatedById = ug.Group.CreatedById, CreatedByName = ug.Group.CreatedBy.Name,
                CreatedAt = ug.Group.CreatedAt, MemberCount = ug.Group.UserGroups.Count,
                CurrentUserRole = ug.Role.ToString()
            }).ToListAsync();
    }

    private async Task<IEnumerable<MeetingResponse>> GetGroupMeetingsInternal(Guid groupId)
    {
        return await _db.Meetings.Where(m => m.GroupId == groupId)
            .OrderByDescending(m => m.ScheduledStart)
            .Select(m => new MeetingResponse
            {
                Id = m.Id, Title = m.Title, Description = m.Description,
                ScheduledStart = m.ScheduledStart, ScheduledEnd = m.ScheduledEnd,
                Status = m.Status, CreatedAt = m.CreatedAt, HostId = m.HostId, HostName = m.Host.Name
            }).ToListAsync();
    }

    [HttpGet("live-meetings")]
    public async Task<ActionResult<ICollection<MeetingResponse>>> GetLiveMeetings()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        List<MeetingResponse> meetings = [];
        foreach (var group in await GetMyGroupsInternal())
            foreach (var meeting in await GetGroupMeetingsInternal(group.Id))
                if (meeting.ScheduledStart <= DateTime.UtcNow && DateTime.UtcNow <= meeting.ScheduledEnd)
                    meetings.Add(meeting);
        return meetings;
    }

    [HttpGet("active-meetings")]
    public async Task<ActionResult<ICollection<MeetingResponse>>> GetActiveMeetings()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        List<MeetingResponse> meetings = [];
        foreach (var group in await GetMyGroupsInternal())
            foreach (var meeting in await GetGroupMeetingsInternal(group.Id))
                if (meeting.ScheduledEnd.HasValue == false || DateTime.UtcNow < meeting.ScheduledEnd)
                    meetings.Add(meeting);
        return meetings;
    }

    [HttpPost("create")]
    public async Task<ActionResult> CreateMeeting(CreateMeetingRequest creatMeetingRequest)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        User x = (await _db.Users.FirstOrDefaultAsync(user => user.Id == userId!.Value))!;
        Meeting meeting = new Meeting
        {
            Id = Guid.NewGuid(), HostId = userId!.Value, Host = x,
            GroupId = creatMeetingRequest.GroupId ?? new Guid(CreateMeetingRequest.GlobalGroupId),
            Title = creatMeetingRequest.Title, Description = creatMeetingRequest.Description,
            ScheduledStart = creatMeetingRequest.ScheduledStart, ScheduledEnd = creatMeetingRequest.ScheduledEnd,
        };
        _db.Meetings.Add(meeting);
        var participant = new MeetingParticipant
        {
            Id = Guid.NewGuid(), MeetingId = meeting.Id, Meeting = meeting,
            UserId = userId!.Value, Role = MeetingParticipantRole.Host, IsActive = true
        };
        _db.MeetingParticipants.Add(participant);
        await _db.SaveChangesAsync();
        return Ok(meeting.Id);
    }


    [HttpPost("join")]
    public async Task<ActionResult> JoinMeeting(JoinMeetingRequest joinMeetingRequest)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        var meetingId = joinMeetingRequest.MeetingId;
        var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == meetingId);
        if (!await IsInGroupAsync(meeting!.GroupId!.Value)) return NotFound();
        var participant = new MeetingParticipant
        {
            Id = Guid.NewGuid(), MeetingId = meetingId, Meeting = meeting,
            UserId = userId!.Value,
            Role = userId!.Value == meeting.HostId ? MeetingParticipantRole.Host : MeetingParticipantRole.Participant,
            IsActive = true
        };
        using var transaction = await _db.Database.BeginTransactionAsync();
        if (await _db.MeetingParticipants.AnyAsync(par => par.UserId == userId.Value && par.MeetingId == meetingId))
            return BadRequest();
        else
        {
            await _db.MeetingParticipants.AddAsync(participant);
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

        var participantsList = await _db.MeetingParticipants.Where(par => par.UserId == userId.Value && par.MeetingId == meetingId).ToListAsync();
        if (participantsList.Count == 0)
            return BadRequest();

        var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == meetingId);
        if (meeting == null || !await IsInGroupAsync(meeting.GroupId!.Value)) return NotFound();

        try
        {
            if (meeting.HostId == userId)
            {
                if (leaveMeetingRequest.EndMeetingForAll)
                {
                    var allParticipants = await _db.MeetingParticipants.Where(p => p.MeetingId == meetingId).ToListAsync();
                    _db.MeetingParticipants.RemoveRange(allParticipants);
                    meeting.Status = MeetingStatus.Ended;
                    meeting.ScheduledEnd = DateTime.UtcNow;
                    await _db.SaveChangesAsync();

                    try
                    {
                        var client = new Livekit.Server.Sdk.Dotnet.RoomServiceClient("https://meetverse-tn25w775.livekit.cloud", "APIVDmR6TG3FFHy", "ZSqPDDGXAVhsuqNuKfpsL8Og9TiahJt2A9rpJw67JJD");
                        await client.DeleteRoom(new Livekit.Server.Sdk.Dotnet.DeleteRoomRequest { Room = meetingId.ToString() });
                    }
                    catch (Exception ex)
                    {
                        MeetVerse.Services.Implementations.Logging.CustomLogger.Log("Failed to delete LiveKit room: " + ex.Message);
                    }
                }
                else
                {
                    _db.MeetingParticipants.RemoveRange(participantsList);
                    var newHost = await _db.MeetingParticipants.FirstOrDefaultAsync(p => p.MeetingId == meetingId && p.UserId != userId);
                    if (newHost != null)
                    {
                        meeting.HostId = newHost.UserId;
                        newHost.Role = MeetingParticipantRole.Host;
                    }
                    else
                    {
                        meeting.Status = MeetingStatus.Ended;
                        meeting.ScheduledEnd = DateTime.UtcNow;
                    }
                    await _db.SaveChangesAsync();
                }
            }
            else
            {
                _db.MeetingParticipants.RemoveRange(participantsList);
                await _db.SaveChangesAsync();
            }
        }
        catch { }
        return Ok();
    }

    [HttpGet("chat")]
    public async Task<ActionResult<IEnumerable<ChatMessageResponse>>> GetChatMessages(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        var chat = await _db.ChatMessages.Where(msg => msg.MeetingId == meetingId).Select(cm => new ChatMessageResponse
        {
            Id = cm.Id, MeetingId = cm.MeetingId, SenderId = cm.SenderId,
            SenderName = cm.Sender!.Name!, Content = cm.Content, SentAt = cm.SentAt
        }).OrderBy(cm => cm.SentAt).ToListAsync();
        return Ok(chat);
    }

    [HttpGet("participants")]
    public async Task<ActionResult<IEnumerable<object>>> GetMeetingParticipants(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        var participants = await _db.MeetingParticipants.Where(p => p.MeetingId == meetingId).Select(p => new
        {
            p.Id, p.MeetingId, p.UserId, p.Role, p.User.Name
        }).ToListAsync();
        return Ok(participants);
    }
    [HttpPatch("{id}/title")]
    public async Task<ActionResult> UpdateMeetingTitle(Guid id, [FromBody] UpdateMeetingTitleRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        
        var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == id);
        if (meeting == null) return NotFound();
        
        // Optional: Ensure only host can update
        if (meeting.HostId != userId) return Forbid();
        
        meeting.Title = request.Title;
        await _db.SaveChangesAsync();
        
        return Ok();
    }
}
