using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Database;
using MeetVerse.Api.Dtos;
using MeetVerse.Api.Models;
using MeetVerse.Api.Services;

namespace MeetVerse.Api.Controllers;

[ApiController]
[Route("api/meetings/{meetingId:guid}/whiteboard")]
[Authorize]
public class WhiteboardController : ControllerBase
{
    private readonly MeetVerseDbContext _db;
    private readonly IMiroWhiteboardService _miro;

    public WhiteboardController(MeetVerseDbContext db, IMiroWhiteboardService miro)
    {
        _db = db;
        _miro = miro;
    }

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

    /// <summary>Get or create the current whiteboard session for the meeting.</summary>
    [HttpGet]
    public async Task<ActionResult<WhiteboardSessionResponse>> GetOrCreateSession(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanAccessMeeting(meetingId, userId.Value)) return NotFound("Meeting not found or access denied.");

        var session = await _db.WhiteboardSessions
            .Where(ws => ws.MeetingId == meetingId && ws.EndedAt == null)
            .OrderByDescending(ws => ws.StartedAt)
            .FirstOrDefaultAsync();

        if (session is null)
        {
            // Create a Miro board for this meeting whiteboard session
            var meeting = await _db.Meetings.FindAsync(meetingId);
            var boardName = $"MeetVerse – {meeting?.Title ?? "Meeting"} Whiteboard";

            MiroBoardResult? board = null;
            try
            {
                board = await _miro.CreateBoardAsync(boardName, $"Whiteboard for meeting {meetingId}");
            }
            catch (Exception ex)
            {
                // Log but don't block session creation if Miro fails
                Console.WriteLine($"[Miro] Failed to create board: {ex.Message}");
            }

            session = new WhiteboardSession
            {
                Id = Guid.NewGuid(),
                MeetingId = meetingId,
                StartedAt = DateTime.UtcNow,
                MiroBoardId = board?.Id,
                MiroBoardViewUrl = board?.ViewLink
            };
            _db.WhiteboardSessions.Add(session);
            await _db.SaveChangesAsync();
        }

        var eventCount = await _db.WhiteboardEvents.CountAsync(e => e.SessionId == session.Id);
        return new WhiteboardSessionResponse
        {
            Id = session.Id,
            MeetingId = session.MeetingId,
            StartedAt = session.StartedAt,
            EndedAt = session.EndedAt,
            EventCount = eventCount,
            MiroBoardUrl = session.MiroBoardViewUrl
        };
    }

    /// <summary>End the current whiteboard session (host only).</summary>
    [HttpPost("end")]
    public async Task<IActionResult> EndSession(Guid meetingId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var meeting = await _db.Meetings.FindAsync(meetingId);
        if (meeting is null || meeting.HostId != userId) return Forbid();

        var session = await _db.WhiteboardSessions
            .Where(ws => ws.MeetingId == meetingId && ws.EndedAt == null)
            .FirstOrDefaultAsync();
        if (session is null) return NotFound("No active whiteboard session.");

        session.EndedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController]
[Route("api/whiteboard/sessions/{sessionId:guid}")]
// [Authorize]
public class WhiteboardSessionController : ControllerBase
{
    private readonly MeetVerseDbContext _db;

    public WhiteboardSessionController(MeetVerseDbContext db)
    {
        _db = db;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task<bool> CanAccessSession(Guid sessionId, Guid userId)
    {
        var session = await _db.WhiteboardSessions
            .Include(ws => ws.Meeting)
            .FirstOrDefaultAsync(ws => ws.Id == sessionId);
        if (session is null) return false;
        if (session.Meeting.HostId == userId) return true;
        return await _db.MeetingParticipants.AnyAsync(mp => mp.MeetingId == session.MeetingId && mp.UserId == userId);
    }

    /// <summary>Get all events for a session (for loading canvas state).</summary>
    [HttpGet("events")]
    public async Task<ActionResult<IEnumerable<WhiteboardEventResponse>>> GetEvents(Guid sessionId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanAccessSession(sessionId, userId.Value)) return NotFound("Session not found or access denied.");

        var events = await _db.WhiteboardEvents
            .Where(e => e.SessionId == sessionId)
            .OrderBy(e => e.CreatedAt)
            .Select(e => new WhiteboardEventResponse
            {
                Id = e.Id,
                SessionId = e.SessionId,
                UserId = e.UserId,
                UserName = e.User.Name,
                Type = e.Type,
                PayloadJson = e.PayloadJson,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();
        return events;
    }
}
