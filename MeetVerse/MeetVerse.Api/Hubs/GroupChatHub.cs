using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Data;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Hubs;

[Authorize]
public class GroupChatHub : Hub
{
    private readonly MeetVerseDbContext _db;
    public const string GroupPrefix = "Group_";

    public GroupChatHub(MeetVerseDbContext db)
    {
        _db = db;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    public async Task JoinGroup(Guid groupId)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }
        var isMember = await _db.UserGroups.AnyAsync(ug => ug.GroupId == groupId && ug.UserId == userId.Value);
        if (!isMember)
        {
            await Clients.Caller.SendAsync("Error", "Not a member of this group");
            return;
        }
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupPrefix + groupId);
        await Clients.Caller.SendAsync("JoinedGroup", groupId);
    }

    public async Task LeaveGroup(Guid groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupPrefix + groupId);
    }

    public async Task SendMessage(Guid groupId, string content)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }
        var isMember = await _db.UserGroups.AnyAsync(ug => ug.GroupId == groupId && ug.UserId == userId.Value);
        if (!isMember)
        {
            await Clients.Caller.SendAsync("Error", "Not a member of this group");
            return;
        }
        content = (content ?? "").Trim();
        if (string.IsNullOrEmpty(content))
        {
            await Clients.Caller.SendAsync("Error", "Message content is required");
            return;
        }

        var sender = await _db.Users.FindAsync(userId.Value);
        var msg = new GroupMessage
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            SenderId = userId.Value,
            Content = content,
            SentAt = DateTime.UtcNow
        };
        _db.GroupMessages.Add(msg);
        await _db.SaveChangesAsync();

        var payload = new
        {
            msg.Id,
            msg.GroupId,
            SenderId = msg.SenderId,
            SenderName = sender?.Name,
            SenderAvatarUrl = sender?.AvatarUrl,
            msg.Content,
            msg.SentAt,
            msg.EditedAt
        };
        await Clients.Group(GroupPrefix + groupId).SendAsync("ReceiveMessage", payload);
    }
}
