using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Persistence.Data;
using MeetVerse.Shared.DTOs.Whiteboard;
using MeetVerse.Domain.Entities;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Shared.Common;

namespace MeetVerse.Presentation.Controllers;

[ApiController]
[Route("api/meetings/{meetingId:guid}/whiteboard")]
[Authorize]
public class WhiteboardController : ControllerBase
{
    private readonly MeetVerseDbContext _db;
    private readonly IMiroWhiteboardService _miro;

    public WhiteboardController(MeetVerseDbContext db, IMiroWhiteboardService miro)
    { _db = db; _miro = miro; }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task<bool> CanAccessMeeting(Guid meetingId, Guid userId)
    {
        var meeting = await _db.Meetings.FindAsync(meetingId);
        return meeting != null;
    }

    [HttpGet]
    public async Task<ActionResult<WhiteboardSessionResponse>> GetOrCreateSession(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanAccessMeeting(meetingId, userId.Value)) return NotFound("Meeting not found or access denied.");
        var session = await _db.WhiteboardSessions
            .Where(ws => ws.MeetingId == meetingId && ws.EndedAt == null)
            .OrderByDescending(ws => ws.StartedAt).FirstOrDefaultAsync();
        if (session is null)
        {
            var meeting = await _db.Meetings.FindAsync(meetingId);
            var boardName = $"MeetVerse – {meeting?.Title ?? "Meeting"} Whiteboard";
            MiroBoardResult? board = null;
            try { board = await _miro.CreateBoardAsync(boardName, $"Whiteboard for meeting {meetingId}"); }
            catch (Exception ex) { Console.WriteLine($"[Miro] Failed to create board: {ex.Message}"); }
            session = new WhiteboardSession
            {
                Id = Guid.NewGuid(), MeetingId = meetingId, StartedAt = DateTime.UtcNow,
                MiroBoardId = board?.Id, MiroBoardViewUrl = board?.ViewLink
            };
            _db.WhiteboardSessions.Add(session);
            await _db.SaveChangesAsync();
        }
        var eventCount = await _db.WhiteboardEvents.CountAsync(e => e.SessionId == session.Id);
        return new WhiteboardSessionResponse
        {
            Id = session.Id, MeetingId = session.MeetingId, StartedAt = session.StartedAt,
            EndedAt = session.EndedAt, EventCount = eventCount, MiroBoardUrl = session.MiroBoardViewUrl
        };
    }

    [HttpPost("end")]
    public async Task<IActionResult> EndSession(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        var meeting = await _db.Meetings.FindAsync(meetingId);
        if (meeting is null || meeting.HostId != userId) return Forbid();
        var session = await _db.WhiteboardSessions
            .Where(ws => ws.MeetingId == meetingId && ws.EndedAt == null).FirstOrDefaultAsync();
        if (session is null) return NotFound("No active whiteboard session.");
        session.EndedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
