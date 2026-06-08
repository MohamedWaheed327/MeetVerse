using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MeetVerse.Persistence.Data;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Presentation.Hubs;

[Authorize]
public class MeetingChatHub : Hub
{
    private readonly MeetVerseDbContext _db;
    public const string MeetingChatPrefix = "meeting_chat_";
    public MeetingChatHub(MeetVerseDbContext db) { _db = db; }
    private Guid? GetCurrentUserId() { var sub = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier); return Guid.TryParse(sub, out var id) ? id : null; }

    public async Task Subscribe(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) { await Clients.Caller.SendAsync("Error", "Unauthorized"); return; }
        await Groups.AddToGroupAsync(Context.ConnectionId, MeetingChatPrefix + meetingId);
    }

    public async Task UnSubscribe(Guid meetingId) => await Groups.RemoveFromGroupAsync(Context.ConnectionId, MeetingChatPrefix + meetingId);

    public async Task SendMessage(Guid meetingId, string content)
    {
        var userId = GetCurrentUserId();
        if (userId is null) { await Clients.Caller.SendAsync("Error", "Unauthorized"); return; }
        content = (content ?? "").Trim();
        if (string.IsNullOrEmpty(content)) { await Clients.Caller.SendAsync("Error", "Message content is required"); return; }
        var sender = await _db.Users.FindAsync(userId.Value);
        var msg = new ChatMessage { Id = Guid.NewGuid(), MeetingId = meetingId, SenderId = userId.Value, Content = content };
        var payload = new { msg.Id, msg.MeetingId, msg.SenderId, SenderName = sender?.Name, SenderAvatarUrl = sender?.AvatarUrl, msg.Content, msg.SentAt };
        await Clients.Group(MeetingChatPrefix + meetingId).SendAsync("MessageSent", payload);
        _db.ChatMessages.Add(msg);
        await _db.SaveChangesAsync();
    }

    public async Task SendMeetingEvent(Guid meetingId, string eventType, object payload)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return;
        var sender = await _db.Users.FindAsync(userId.Value);
        
        await Clients.Group(MeetingChatPrefix + meetingId).SendAsync("MeetingEventReceived", new 
        { 
            MeetingId = meetingId,
            SenderId = userId.Value.ToString(), 
            SenderName = sender?.Name,
            EventType = eventType, 
            Payload = payload,
            SentAt = DateTime.UtcNow
        });
    }
}
