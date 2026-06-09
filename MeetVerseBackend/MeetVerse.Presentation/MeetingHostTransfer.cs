using System.Text.Json;
using MeetVerse.Domain.Entities;
using MeetVerse.Domain.Enums;
using MeetVerse.Persistence.Data;
using MeetVerse.Presentation.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MeetVerse.Presentation;

public static class MeetingHostTransfer
{
    public static MeetingParticipant? PickRandomNewHost(
        IEnumerable<MeetingParticipant> candidates)
    {
        var list = candidates.ToList();
        if (list.Count == 0) return null;
        return list[Random.Shared.Next(list.Count)];
    }

    public static async Task<bool> TryTransferHostAsync(
        MeetVerseDbContext db,
        IHubContext<MeetingChatHub> hub,
        Guid meetingId,
        Guid leavingHostId,
        bool removeLeavingParticipantRows = true)
    {
        var meeting = await db.Meetings.FirstOrDefaultAsync(m => m.Id == meetingId);
        if (meeting == null || meeting.HostId != leavingHostId || meeting.Status == MeetingStatus.Ended)
            return false;

        var candidates = await db.MeetingParticipants
            .Include(p => p.User)
            .Where(p => p.MeetingId == meetingId && p.UserId != leavingHostId && p.IsActive)
            .ToListAsync();

        var newHost = PickRandomNewHost(candidates);
        if (newHost == null)
        {
            meeting.Status = MeetingStatus.Ended;
            meeting.ScheduledEnd = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return false;
        }

        if (removeLeavingParticipantRows)
        {
            var leavingRows = await db.MeetingParticipants
                .Where(p => p.MeetingId == meetingId && p.UserId == leavingHostId)
                .ToListAsync();
            foreach (var row in leavingRows)
                row.Role = MeetingParticipantRole.Participant;
            db.MeetingParticipants.RemoveRange(leavingRows);
        }

        meeting.HostId = newHost.UserId;
        newHost.Role = MeetingParticipantRole.Host;
        await db.SaveChangesAsync();

        var hostName = newHost.User?.Name ?? "A participant";
        await hub.Clients
            .Group(MeetingChatHub.MeetingChatPrefix + meetingId)
            .SendAsync("MeetingEventReceived", new
            {
                MeetingId = meetingId,
                EventType = "meeting:host-changed",
                SenderName = hostName,
                Payload = JsonSerializer.Serialize(new
                {
                    newHostId = newHost.UserId.ToString(),
                    newHostName = hostName
                }),
                SentAt = DateTime.UtcNow
            });

        var newHostConnectionIds = MeetingChatHub.GetConnectionIdsForUser(meetingId, newHost.UserId);
        foreach (var connectionId in newHostConnectionIds)
        {
            await hub.Clients.Client(connectionId).SendAsync("MeetingEventReceived", new
            {
                MeetingId = meetingId,
                EventType = "meeting:host-transferred",
                Payload = JsonSerializer.Serialize(new
                {
                    newHostId = newHost.UserId.ToString(),
                    newHostName = hostName
                }),
                SentAt = DateTime.UtcNow
            });
        }

        return true;
    }
}
