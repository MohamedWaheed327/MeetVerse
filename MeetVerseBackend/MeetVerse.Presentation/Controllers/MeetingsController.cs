using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Persistence.Data;
using MeetVerse.Presentation;
using MeetVerse.Presentation.Hubs;
using MeetVerse.Shared.DTOs.Groups;
using MeetVerse.Shared.DTOs.Meetings;
using MeetVerse.Domain.Entities;
using MeetVerse.Domain.Enums;
using MeetVerse.Shared.Configuration;
using Microsoft.Extensions.Options;

namespace MeetVerse.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly MeetVerseDbContext _db;
    private readonly IHubContext<MeetingChatHub> _meetingHub;
    private readonly LiveKitSettings _liveKitSettings;

    public MeetingsController(
        MeetVerseDbContext db,
        IHubContext<MeetingChatHub> meetingHub,
        IOptions<LiveKitSettings> liveKitSettings)
    {
        _db = db;
        _meetingHub = meetingHub;
        _liveKitSettings = liveKitSettings.Value;
    }

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

    [HttpGet("live-meetings")]
    public async Task<ActionResult<ICollection<MeetingResponse>>> GetLiveMeetings()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var meetings = await _db.Meetings
            .AsNoTracking()
            .Where(m => 
                (m.GroupId == null && m.HostId == userId) || 
                (m.GroupId != null && m.Group!.UserGroups.Any(ug => ug.UserId == userId))
            )
            .Where(m => m.ScheduledStart <= DateTime.UtcNow && (m.ScheduledEnd == null || DateTime.UtcNow <= m.ScheduledEnd))
            .OrderByDescending(m => m.ScheduledStart)
            .Select(m => new MeetingResponse
            {
                Id = m.Id, Title = m.Title, HostId = m.HostId, HostName = m.Host.Name,
                HasPassword = m.Password != null, Description = m.Description,
                ScheduledStart = m.ScheduledStart, ScheduledEnd = m.ScheduledEnd,
                Status = m.Status, CreatedAt = m.CreatedAt,
                GroupId = m.GroupId, GroupName = m.Group != null ? m.Group.Name : null
            })
            .ToListAsync();

        return meetings;
    }

    [HttpGet("active-meetings")]
    public async Task<ActionResult<ICollection<MeetingResponse>>> GetActiveMeetings()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var meetings = await _db.Meetings
            .AsNoTracking()
            .Where(m => 
                (m.GroupId == null && m.HostId == userId) || 
                (m.GroupId != null && m.Group!.UserGroups.Any(ug => ug.UserId == userId))
            )
            .Where(m => m.ScheduledEnd == null || DateTime.UtcNow < m.ScheduledEnd)
            .OrderByDescending(m => m.ScheduledStart)
            .Select(m => new MeetingResponse
            {
                Id = m.Id, Title = m.Title, HostId = m.HostId, HostName = m.Host.Name,
                HasPassword = m.Password != null, Description = m.Description,
                ScheduledStart = m.ScheduledStart, ScheduledEnd = m.ScheduledEnd,
                Status = m.Status, CreatedAt = m.CreatedAt,
                GroupId = m.GroupId, GroupName = m.Group != null ? m.Group.Name : null
            })
            .ToListAsync();

        return meetings;
    }

    [HttpGet("history")]
    public async Task<ActionResult<ICollection<MeetingResponse>>> GetMeetingHistory()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var query = from m in _db.Meetings
                    join g in _db.Groups on m.GroupId equals g.Id into groups
                    from g in groups.DefaultIfEmpty()
                    join host in _db.Users on m.HostId equals host.Id
                    where (
                            // Private meetings where user is host
                            (m.GroupId == null && m.HostId == userId)
                            ||
                            // Group meetings where user is a member
                            (m.GroupId != null && _db.UserGroups.Any(u => u.GroupId == g.Id && u.UserId == userId))
                          )
                          &&
                          // Only include ended or past meetings
                          (m.Status == MeetVerse.Domain.Enums.MeetingStatus.Ended || (m.ScheduledEnd != null && DateTime.UtcNow >= m.ScheduledEnd))
                    orderby m.ScheduledStart descending
                    select new MeetingResponse
                    {
                        Id = m.Id,
                        Title = m.Title,
                        HostId = m.HostId,
                        HostName = host.Name,
                        HasPassword = m.Password != null,
                        Description = m.Description,
                        ScheduledStart = m.ScheduledStart,
                        ScheduledEnd = m.ScheduledEnd,
                        Status = m.Status,
                        CreatedAt = m.CreatedAt,
                        GroupId = m.GroupId,
                        GroupName = g != null ? g.Name : null
                    };

        var meetings = await query.ToListAsync();
        return Ok(meetings);
    }

    [HttpPost("create")]
    public async Task<ActionResult> CreateMeeting(CreateMeetingRequest creatMeetingRequest)
    {
        if (creatMeetingRequest.ScheduledStart < DateTime.UtcNow.AddMinutes(-1))
        {
            return BadRequest("Cannot schedule a meeting in the past.");
        }

        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        User x = (await _db.Users.FirstOrDefaultAsync(user => user.Id == userId!.Value))!;
        Meeting meeting = new Meeting
        {
            Id = Guid.NewGuid(), HostId = userId!.Value, Host = x,
            GroupId = creatMeetingRequest.GroupId,
            Title = creatMeetingRequest.Title, Description = creatMeetingRequest.Description,
            ScheduledStart = creatMeetingRequest.ScheduledStart, ScheduledEnd = creatMeetingRequest.ScheduledEnd,
            Password = creatMeetingRequest.SecurePassword ? creatMeetingRequest.Password : null
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

    [HttpPatch("{meetingId}")]
    public async Task<ActionResult> UpdateMeeting(Guid meetingId, [FromBody] UpdateMeetingRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == meetingId);
        if (meeting == null) return NotFound();

        // 2. Role-Based Authorization: Only the Host can modify
        if (meeting.HostId != userId)
        {
            return StatusCode(403, "Only the meeting owner can modify this meeting.");
        }

        // Handle partial updates properly
        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            meeting.Title = request.Title;
        }
        
        if (request.Description != null)
        {
            meeting.Description = request.Description;
        }

        if (request.ScheduledStart.HasValue)
        {
            if (request.ScheduledStart.Value < DateTime.UtcNow.AddMinutes(-1))
            {
                return BadRequest("Cannot schedule a meeting in the past.");
            }
            meeting.ScheduledStart = request.ScheduledStart.Value;
        }

        await _db.SaveChangesAsync();
        return Ok();
    }


    [HttpPost("join")]
    public async Task<ActionResult> JoinMeeting(JoinMeetingRequest joinMeetingRequest)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        var meetingId = joinMeetingRequest.MeetingId;
        var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == meetingId);
        if (meeting == null) return NotFound();
        
        if (meeting.GroupId != null)
        {
            if (!await IsInGroupAsync(meeting.GroupId.Value)) return NotFound();
        }
        else
        {
            // Private meeting: Only the host can join directly (others need an invite link/password check which is handled below, but let's allow them if they have the link and we're not enforcing strict invites yet).
            // Actually, the previous logic just checked IsInGroupAsync. For private meetings, we should just let them proceed to the password check.
        }

        // Password Check
        if (meeting.Password != null && meeting.HostId != userId)
        {
            if (joinMeetingRequest.Password != meeting.Password)
            {
                return Unauthorized("Invalid meeting password");
            }
        }
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
        if (meeting == null) return NotFound();
        if (meeting.GroupId != null && !await IsInGroupAsync(meeting.GroupId.Value)) return NotFound();

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

                    await _meetingHub.Clients
                        .Group(MeetingChatHub.MeetingChatPrefix + meetingId)
                        .SendAsync("MeetingEventReceived", new
                        {
                            MeetingId = meetingId,
                            EventType = "meeting:ended",
                            Payload = "{}",
                            SentAt = DateTime.UtcNow
                        });

                    try
                    {
                        var client = new Livekit.Server.Sdk.Dotnet.RoomServiceClient(
                            "https://meetverse-tn25w775.livekit.cloud",
                            _liveKitSettings.ApiKey,
                            _liveKitSettings.ApiSecret);
                        await client.DeleteRoom(new Livekit.Server.Sdk.Dotnet.DeleteRoomRequest { Room = meetingId.ToString() });
                    }
                    catch (Exception ex)
                    {
                        MeetVerse.Services.Implementations.Logging.CustomLogger.Log("Failed to delete LiveKit room: " + ex.Message);
                    }
                }
                else
                {
                    await MeetingHostTransfer.TryTransferHostAsync(
                        _db,
                        _meetingHub,
                        meetingId,
                        userId.Value,
                        removeLeavingParticipantRows: true);
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
        var chat = await _db.ChatMessages
            .AsNoTracking()
            .Where(msg => msg.MeetingId == meetingId).Select(cm => new ChatMessageResponse
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
        var participants = await _db.MeetingParticipants
            .AsNoTracking()
            .Where(p => p.MeetingId == meetingId).Select(p => new
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
        
        // Ensure only host can update
        if (meeting.HostId != userId) return Forbid();
        
        meeting.Title = request.Title;
        await _db.SaveChangesAsync();
        
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteMeeting(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        
        var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == id);
        if (meeting == null) return NotFound();
        
        if (meeting.HostId != userId) return Forbid();
        
        _db.Meetings.Remove(meeting);
        await _db.SaveChangesAsync();
        
        return Ok();
    }

    [HttpPatch("{id:guid}/start-now")]
    public async Task<ActionResult> StartMeetingNow(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        
        var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == id);
        if (meeting == null) return NotFound();
        
        if (meeting.HostId != userId) return Forbid();
        
        meeting.ScheduledStart = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        
        return Ok();
    }
}
