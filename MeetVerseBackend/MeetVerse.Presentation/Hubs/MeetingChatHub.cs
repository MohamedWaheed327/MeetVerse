using System.Security.Claims;
using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MeetVerse.Persistence.Data;
using MeetVerse.Domain.Entities;
using MeetVerse.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using MeetVerse.Presentation;

namespace MeetVerse.Presentation.Hubs;

[Authorize]
public class MeetingChatHub : Hub
{
    private readonly MeetVerseDbContext _db;
    private readonly IServiceProvider _serviceProvider;
    public const string MeetingChatPrefix = "meeting_chat_";
    
    private static readonly ConcurrentDictionary<string, (Guid UserId, Guid MeetingId)> _connections = new();

    public static IReadOnlyList<string> GetConnectionIdsForUser(Guid meetingId, Guid userId) =>
        _connections
            .Where(c => c.Value.MeetingId == meetingId && c.Value.UserId == userId)
            .Select(c => c.Key)
            .ToList();

    public MeetingChatHub(MeetVerseDbContext db, IServiceProvider serviceProvider) 
    { 
        _db = db; 
        _serviceProvider = serviceProvider;
    }
    
    private Guid? GetCurrentUserId() { var sub = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier); return Guid.TryParse(sub, out var id) ? id : null; }

    public async Task Subscribe(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) { await Clients.Caller.SendAsync("Error", "Unauthorized"); return; }
        
        _connections[Context.ConnectionId] = (userId.Value, meetingId);

        var participant = _db.MeetingParticipants.FirstOrDefault(p => p.MeetingId == meetingId && p.UserId == userId.Value);
        if (participant != null) {
            participant.IsActive = true;
            await _db.SaveChangesAsync();
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, MeetingChatPrefix + meetingId);
        
        await Clients.Caller.SendAsync("joinedsession", new { UserId = userId.Value, MeetingId = meetingId });
    }

    public async Task UnSubscribe(Guid meetingId) 
    {
        var userId = GetCurrentUserId();
        if (userId != null) 
        {
            var participant = _db.MeetingParticipants.FirstOrDefault(p => p.MeetingId == meetingId && p.UserId == userId.Value);
            if (participant != null) {
                participant.IsActive = false;
                await _db.SaveChangesAsync();
            }
        }
        _connections.TryRemove(Context.ConnectionId, out _);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, MeetingChatPrefix + meetingId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var data))
        {
            var (userId, meetingId) = data;
            
            var participant = _db.MeetingParticipants.FirstOrDefault(p => p.MeetingId == meetingId && p.UserId == userId);
            if (participant != null) {
                participant.IsActive = false;
                await _db.SaveChangesAsync();
            }

            var meeting = await _db.Meetings.FindAsync(meetingId);
            if (meeting != null && meeting.HostId == userId && meeting.Status != MeetingStatus.Ended)
            {
                var cts = new CancellationTokenSource();
                try 
                {
                    await Task.Delay(10000, cts.Token);
                }
                catch (TaskCanceledException) {}
                
                using var scope = _serviceProvider.CreateScope();
                var scopedDb = scope.ServiceProvider.GetRequiredService<MeetVerseDbContext>();
                var currentMeeting = await scopedDb.Meetings.FindAsync(meetingId);
                
                if (currentMeeting != null && currentMeeting.HostId == userId && currentMeeting.Status != MeetingStatus.Ended)
                {
                    bool hasReconnected = _connections.Values.Any(v => v.UserId == userId && v.MeetingId == meetingId);
                    if (!hasReconnected)
                    {
                        var hub = scope.ServiceProvider.GetRequiredService<IHubContext<MeetingChatHub>>();
                        await MeetingHostTransfer.TryTransferHostAsync(
                            scopedDb,
                            hub,
                            meetingId,
                            userId,
                            removeLeavingParticipantRows: false);
                    }
                }
            }
            
            _connections.TryRemove(Context.ConnectionId, out _);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task EndMeeting(Guid meetingId, Guid hostId)
    {
        var userId = GetCurrentUserId();
        if (userId != hostId) return;
        
        var meeting = await _db.Meetings.FindAsync(meetingId);
        if (meeting != null && meeting.HostId == userId)
        {
            meeting.Status = MeetingStatus.Ended;
            
            var participants = _db.MeetingParticipants.Where(p => p.MeetingId == meetingId);
            foreach(var p in participants) {
                p.IsActive = false;
                p.LeftAt = DateTime.UtcNow;
            }
            
            await _db.SaveChangesAsync();
            
            await Clients.Group(MeetingChatPrefix + meetingId).SendAsync("MeetingEventReceived", new {
                MeetingId = meetingId,
                EventType = "meeting:ended",
                Payload = new { }
            });
        }
    }

    public async Task TransferHost(Guid meetingId, Guid newHostId)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return;
        
        var meeting = await _db.Meetings.FindAsync(meetingId);
        if (meeting != null && meeting.HostId == userId.Value)
        {
            meeting.HostId = newHostId;
            
            var currentParticipant = _db.MeetingParticipants.FirstOrDefault(p => p.MeetingId == meetingId && p.UserId == userId.Value);
            var nextParticipant = _db.MeetingParticipants.FirstOrDefault(p => p.MeetingId == meetingId && p.UserId == newHostId);
            
            if (currentParticipant != null) currentParticipant.Role = MeetingParticipantRole.Participant;
            if (nextParticipant != null) nextParticipant.Role = MeetingParticipantRole.Host;
            
            await _db.SaveChangesAsync();
            
            await Clients.Group(MeetingChatPrefix + meetingId).SendAsync("MeetingEventReceived", new {
                MeetingId = meetingId,
                EventType = "meeting:host-changed",
                Payload = new { newHostId = newHostId }
            });
            
            var nextHostConnections = _connections.Where(c => c.Value.UserId == newHostId && c.Value.MeetingId == meetingId).Select(c => c.Key).ToList();
            foreach(var cid in nextHostConnections) {
                await Clients.Client(cid).SendAsync("MeetingEventReceived", new {
                    MeetingId = meetingId,
                    EventType = "meeting:host-transferred",
                    Payload = new { newHostId = newHostId }
                });
            }
        }
    }

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
