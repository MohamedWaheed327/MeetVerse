using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Persistence.Data;
using MeetVerse.Shared.DTOs.Whiteboard;
using MeetVerse.Presentation.Hubs;

namespace MeetVerse.Presentation.Controllers;

[ApiController]
[Route("api/whiteboard/sessions/{sessionId:guid}")]
public class WhiteboardSessionController : ControllerBase
{
    private readonly MeetVerseDbContext _db;
    private readonly IHubContext<WhiteboardHub> _hubContext;

    public WhiteboardSessionController(MeetVerseDbContext db, IHubContext<WhiteboardHub> hubContext) { _db = db; _hubContext = hubContext; }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task<bool> CanAccessSession(Guid sessionId, Guid userId)
    {
        var session = await _db.WhiteboardSessions.Include(ws => ws.Meeting).FirstOrDefaultAsync(ws => ws.Id == sessionId);
        if (session is null) return false;
        if (session.Meeting.HostId == userId) return true;
        return await _db.MeetingParticipants.AnyAsync(mp => mp.MeetingId == session.MeetingId && mp.UserId == userId);
    }

    [HttpGet("events")]
    public async Task<ActionResult<IEnumerable<WhiteboardEventResponse>>> GetEvents(Guid sessionId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanAccessSession(sessionId, userId.Value)) return NotFound("Session not found or access denied.");
        var events = await _db.WhiteboardEvents.Where(e => e.SessionId == sessionId).OrderBy(e => e.CreatedAt)
            .Select(e => new WhiteboardEventResponse
            {
                Id = e.Id, SessionId = e.SessionId, UserId = e.UserId, UserName = e.User.Name,
                Type = e.Type, PayloadJson = e.PayloadJson, CreatedAt = e.CreatedAt
            }).ToListAsync();
        return events;
    }

    [HttpPost("snapshots")]
    public async Task<IActionResult> CreateSnapshot(Guid sessionId, [FromBody] JsonElement body)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanAccessSession(sessionId, userId.Value)) return NotFound("Session not found or access denied.");

        // Expect body to be { name?: string, scene: { ... } }
        string name = string.Empty;
        JsonElement scene;
        try
        {
            if (body.TryGetProperty("name", out var nameProp)) name = nameProp.GetString() ?? string.Empty;
            scene = body.GetProperty("scene");
        }
        catch (Exception)
        {
            return BadRequest("Invalid snapshot payload. Expect { name?: string, scene: {...} }");
        }

        var payloadJson = JsonSerializer.Serialize(new { name, scene });

        var evt = new MeetVerse.Domain.Entities.WhiteboardEvent
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            UserId = userId.Value,
            Type = "excalidraw_snapshot",
            PayloadJson = payloadJson,
            CreatedAt = DateTime.UtcNow
        };

        _db.WhiteboardEvents.Add(evt);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(userId.Value);
        var payload = new { Id = evt.Id, SessionId = evt.SessionId, UserId = evt.UserId, UserName = user?.Name, Type = evt.Type, PayloadJson = evt.PayloadJson, CreatedAt = evt.CreatedAt };

        // Broadcast to connected clients in the whiteboard group
        await _hubContext.Clients.Group(WhiteboardHub.GroupPrefix + sessionId).SendAsync("ReceiveWhiteboardEvent", payload);

        return CreatedAtAction(nameof(GetSnapshot), new { sessionId, snapshotId = evt.Id }, new { evt.Id });
    }

    [HttpGet("snapshots")]
    public async Task<ActionResult<IEnumerable<WhiteboardEventResponse>>> GetSnapshots(Guid sessionId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanAccessSession(sessionId, userId.Value)) return NotFound("Session not found or access denied.");

        var snapshots = await _db.WhiteboardEvents.Where(e => e.SessionId == sessionId && (e.Type.Contains("snapshot") || e.Type.Contains("excalidraw"))).OrderBy(e => e.CreatedAt)
            .Select(e => new WhiteboardEventResponse
            {
                Id = e.Id, SessionId = e.SessionId, UserId = e.UserId, UserName = e.User.Name,
                Type = e.Type, PayloadJson = e.PayloadJson, CreatedAt = e.CreatedAt
            }).ToListAsync();
        return snapshots;
    }

    [HttpGet("snapshots/{snapshotId:guid}")]
    public async Task<ActionResult<WhiteboardEventResponse>> GetSnapshot(Guid sessionId, Guid snapshotId)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await CanAccessSession(sessionId, userId.Value)) return NotFound("Session not found or access denied.");

        var e = await _db.WhiteboardEvents.Include(w => w.User).FirstOrDefaultAsync(x => x.Id == snapshotId && x.SessionId == sessionId);
        if (e is null) return NotFound();

        return new WhiteboardEventResponse { Id = e.Id, SessionId = e.SessionId, UserId = e.UserId, UserName = e.User.Name, Type = e.Type, PayloadJson = e.PayloadJson, CreatedAt = e.CreatedAt };
    }
}
