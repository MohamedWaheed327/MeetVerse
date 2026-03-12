using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Data;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Hubs;

[Authorize]
public class WhiteboardHub : Hub
{
    private readonly MeetVerseDbContext _db;
    public const string GroupPrefix = "Whiteboard_";

    public WhiteboardHub(MeetVerseDbContext db)
    {
        _db = db;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task<bool> CanAccessSession(Guid sessionId, Guid userId)
    {
        var session = await _db.WhiteboardSessions
            .Include(ws => ws.Meeting)
            .FirstOrDefaultAsync(ws => ws.Id == sessionId);
        if (session is null || session.EndedAt is not null) return false;
        if (session.Meeting.HostId == userId) return true;
        return await _db.MeetingParticipants.AnyAsync(mp => mp.MeetingId == session.MeetingId && mp.UserId == userId);
    }

    public async Task JoinSession(Guid sessionId)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }
        if (!await CanAccessSession(sessionId, userId.Value))
        {
            await Clients.Caller.SendAsync("Error", "Session not found or access denied.");
            return;
        }
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupPrefix + sessionId);
        await Clients.Caller.SendAsync("JoinedSession", sessionId);
    }

    public async Task SendWhiteboardEvent(Guid sessionId, string type, string payloadJson)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }
        if (!await CanAccessSession(sessionId, userId.Value))
        {
            await Clients.Caller.SendAsync("Error", "Session not found or access denied.");
            return;
        }

        type = (type ?? "draw").ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(payloadJson)) payloadJson = "{}";

        var evt = new WhiteboardEvent
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            UserId = userId.Value,
            Type = type,
            PayloadJson = payloadJson,
            CreatedAt = DateTime.UtcNow
        };
        _db.WhiteboardEvents.Add(evt);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(userId.Value);
        var payload = new
        {
            evt.Id,
            evt.SessionId,
            UserId = evt.UserId,
            UserName = user?.Name,
            evt.Type,
            evt.PayloadJson,
            evt.CreatedAt
        };
        await Clients.Group(GroupPrefix + sessionId).SendAsync("ReceiveWhiteboardEvent", payload);
    }
}
