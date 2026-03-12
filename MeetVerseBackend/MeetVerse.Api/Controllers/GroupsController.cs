using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Data;
using MeetVerse.Api.Dtos;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize]
public class GroupsController : ControllerBase
{
    private readonly MeetVerseDbContext _db;

    public GroupsController(MeetVerseDbContext db)
    {
        _db = db;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        sub = _db.Users.FirstOrDefault().Id.ToString(); // TODO: remove this line
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task<bool> IsMember(Guid groupId, Guid userId, GroupMemberRole? minRole = null)
    {
        var ug = await _db.UserGroups.FindAsync(userId, groupId);
        if (ug is null) return false;
        if (minRole is null) return true;
        return ug.Role >= minRole;
    }

    private async Task<bool> CanManageGroup(Guid groupId, Guid userId) =>
        await IsMember(groupId, userId, GroupMemberRole.Admin);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GroupResponse>>> GetMyGroups()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var groups = await _db.UserGroups
            .Where(ug => ug.UserId == userId)
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

    [HttpPost]
    public async Task<ActionResult<GroupResponse>> CreateGroup([FromBody] CreateGroupRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CreatedById = userId.Value,
            CreatedAt = DateTime.UtcNow
        };
        _db.Groups.Add(group);
        _db.UserGroups.Add(new UserGroup
        {
            UserId = userId.Value,
            GroupId = group.Id,
            Role = GroupMemberRole.Owner,
            JoinedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var creator = await _db.Users.FindAsync(userId);
        return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, new GroupResponse
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            CreatedById = group.CreatedById,
            CreatedByName = creator?.Name,
            CreatedAt = group.CreatedAt,
            MemberCount = 1,
            CurrentUserRole = GroupMemberRole.Owner.ToString()
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupResponse>> GetGroup(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await IsMember(id, userId.Value)) return NotFound();

        var group = await _db.Groups
            .Where(g => g.Id == id)
            .Select(g => new GroupResponse
            {
                Id = g.Id,
                Name = g.Name,
                Description = g.Description,
                CreatedById = g.CreatedById,
                CreatedByName = g.CreatedBy.Name,
                CreatedAt = g.CreatedAt,
                MemberCount = g.UserGroups.Count,
                CurrentUserRole = g.UserGroups.Where(ug => ug.UserId == userId).Select(ug => ug.Role.ToString()).FirstOrDefault()
            })
            .FirstOrDefaultAsync();
        if (group is null) return NotFound();
        return group;
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateGroup(Guid id, [FromBody] UpdateGroupRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanManageGroup(id, userId.Value)) return Forbid();

        var group = await _db.Groups.FindAsync(id);
        if (group is null) return NotFound();
        if (request.Name is { } n) group.Name = n.Trim();
        if (request.Description is { } d) group.Description = d.Trim();
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteGroup(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var ug = await _db.UserGroups.FindAsync(userId.Value, id);
        if (ug is null) return NotFound();
        if (ug.Role != GroupMemberRole.Owner) return Forbid();

        var group = await _db.Groups.FindAsync(id);
        if (group is null) return NotFound();
        _db.Groups.Remove(group);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<IEnumerable<GroupMemberResponse>>> GetMembers(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await IsMember(id, userId.Value)) return NotFound();

        var members = await _db.UserGroups
            .Where(ug => ug.GroupId == id)
            .Select(ug => new GroupMemberResponse
            {
                UserId = ug.User.Id,
                Name = ug.User.Name,
                Email = ug.User.Email,
                AvatarUrl = ug.User.AvatarUrl,
                Role = ug.Role.ToString(),
                JoinedAt = ug.JoinedAt
            })
            .ToListAsync();
        return members;
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddGroupMemberRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanManageGroup(id, userId.Value)) return Forbid();

        var newUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (newUser is null) return NotFound("User with this email not found");
        if (await _db.UserGroups.AnyAsync(ug => ug.GroupId == id && ug.UserId == newUser.Id))
            return BadRequest("User is already a member");

        var role = request.Role?.ToLowerInvariant() == "admin"
            ? GroupMemberRole.Admin
            : GroupMemberRole.Member;
        _db.UserGroups.Add(new UserGroup
        {
            UserId = newUser.Id,
            GroupId = id,
            Role = role,
            JoinedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var target = await _db.UserGroups.FindAsync(memberId, id);
        if (target is null) return NotFound();
        var canManage = await CanManageGroup(id, userId.Value);
        if (userId == memberId)
        {
            _db.UserGroups.Remove(target);
            await _db.SaveChangesAsync();
            return NoContent();
        }
        if (!canManage) return Forbid();
        var currentUg = await _db.UserGroups.FindAsync(userId.Value, id);
        if (currentUg is null) return Forbid();
        if (currentUg.Role <= target.Role)
            return Forbid();
        _db.UserGroups.Remove(target);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:guid}/members/{memberId:guid}/role")]
    public async Task<IActionResult> SetMemberRole(Guid id, Guid memberId, [FromBody] SetGroupMemberRoleRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanManageGroup(id, userId.Value)) return Forbid();

        var target = await _db.UserGroups.FindAsync(memberId, id);
        if (target is null) return NotFound();

        if (!Enum.TryParse<GroupMemberRole>(request.Role, true, out var newRole))
            return BadRequest("Invalid role");

        var currentUg = await _db.UserGroups.FindAsync(userId.Value, id);
        if (currentUg is null) return Forbid();

        if (currentUg.Role != GroupMemberRole.Owner &&
            (newRole == GroupMemberRole.Owner || target.Role == GroupMemberRole.Owner))
            return Forbid();

        target.Role = newRole;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/meetings")]
    public async Task<ActionResult<IEnumerable<object>>> GetGroupMeetings(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await IsMember(id, userId.Value)) return NotFound();

        var meetings = await _db.Meetings
            .Where(m => m.GroupId == id)
            .OrderByDescending(m => m.ScheduledStart)
            .Select(m => new
            {
                m.Id,
                m.Title,
                m.Description,
                m.ScheduledStart,
                m.ScheduledEnd,
                m.Status,
                m.CreatedAt,
                HostId = m.HostId,
                HostName = m.Host.Name
            })
            .ToListAsync();
        return Ok(meetings);
    }

    [HttpPost("{id:guid}/meetings")]
    public async Task<ActionResult<object>> CreateGroupMeeting(Guid id, [FromBody] CreateGroupMeetingRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await IsMember(id, userId.Value)) return NotFound();

        var meeting = new Meeting
        {
            Id = Guid.NewGuid(),
            HostId = userId.Value,
            GroupId = id,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            ScheduledStart = request.ScheduledStart,
            ScheduledEnd = request.ScheduledEnd,
            Status = MeetingStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        var host = await _db.Users.FindAsync(userId);
        var payload = new
        {
            meeting.Id,
            meeting.Title,
            meeting.Description,
            meeting.ScheduledStart,
            meeting.ScheduledEnd,
            meeting.Status,
            meeting.CreatedAt,
            HostId = meeting.HostId,
            HostName = host?.Name
        };
        return Created($"/api/groups/{id}/meetings/{meeting.Id}", payload);
    }

    [HttpGet("{id:guid}/messages")]
    public async Task<ActionResult<IEnumerable<GroupMessageResponse>>> GetMessages(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await IsMember(id, userId.Value)) return NotFound();

        pageSize = Math.Clamp(pageSize, 1, 100);
        var messages = await _db.GroupMessages
            .Where(gm => gm.GroupId == id && gm.DeletedAt == null)
            .OrderByDescending(gm => gm.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(gm => new GroupMessageResponse
            {
                Id = gm.Id,
                GroupId = gm.GroupId,
                SenderId = gm.SenderId,
                SenderName = gm.Sender.Name,
                SenderAvatarUrl = gm.Sender.AvatarUrl,
                Content = gm.Content,
                SentAt = gm.SentAt,
                EditedAt = gm.EditedAt
            })
            .ToListAsync();
        return Ok(messages.OrderBy(m => m.SentAt).ToList());
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<ActionResult<GroupMessageResponse>> SendMessage(Guid id, [FromBody] SendGroupMessageRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await IsMember(id, userId.Value)) return NotFound();

        var msg = new GroupMessage
        {
            Id = Guid.NewGuid(),
            GroupId = id,
            SenderId = userId.Value,
            Content = request.Content?.Trim() ?? "",
            SentAt = DateTime.UtcNow
        };
        _db.GroupMessages.Add(msg);
        await _db.SaveChangesAsync();

        var sender = await _db.Users.FindAsync(userId);
        return CreatedAtAction(nameof(GetMessages), new { id }, new GroupMessageResponse
        {
            Id = msg.Id,
            GroupId = msg.GroupId,
            SenderId = msg.SenderId,
            SenderName = sender?.Name,
            SenderAvatarUrl = sender?.AvatarUrl,
            Content = msg.Content,
            SentAt = msg.SentAt,
            EditedAt = msg.EditedAt
        });
    }
}
