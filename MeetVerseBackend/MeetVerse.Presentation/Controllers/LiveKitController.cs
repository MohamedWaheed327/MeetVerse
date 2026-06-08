using Microsoft.AspNetCore.Mvc;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Services.Implementations.Logging;
using Livekit.Server.Sdk.Dotnet;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Persistence.Data;

namespace MeetVerse.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LiveKitController : ControllerBase
{
    private const string ApiKey = "APIVDmR6TG3FFHy";
    private const string ApiSecret = "ZSqPDDGXAVhsuqNuKfpsL8Og9TiahJt2A9rpJw67JJD";
    private readonly ILiveKitTokenService _liveKitTokenService;
    private readonly MeetVerseDbContext _db;

    public LiveKitController(ILiveKitTokenService liveKitTokenService, MeetVerseDbContext db) 
    { 
        _liveKitTokenService = liveKitTokenService; 
        _db = db;
    }

    [HttpGet("token")]
    public IActionResult GetToken([FromQuery] string username, [FromQuery] string room, [FromQuery] string displayName, [FromQuery] string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(room))
            return BadRequest("username and room are required");
        var token = _liveKitTokenService.CreateToken(username, room, displayName, avatarUrl);
        return Ok(new { token });
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> ReceiveWebhook()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();
        try
        {
            var webhookReceiver = new WebhookReceiver(ApiKey, ApiSecret);
            var liveEvent = webhookReceiver.Receive(body, authHeader);
            switch (liveEvent.Event)
            {
                case "participant_joined":
                    CustomLogger.Log($"{liveEvent.Participant.Name} ({liveEvent.Participant.Identity}) joined {liveEvent.Room.Name}");
                    break;
                case "participant_left":
                    CustomLogger.Log($"{liveEvent.Participant.Name} ({liveEvent.Participant.Identity}) left {liveEvent.Room.Name}");
                    try 
                    {
                        if (Guid.TryParse(liveEvent.Room.Name, out var meetingId) && Guid.TryParse(liveEvent.Participant.Identity, out var userId))
                        {
                            var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == meetingId);
                            if (meeting != null && meeting.HostId == userId)
                            {
                                var participants = await _db.MeetingParticipants.Where(p => p.MeetingId == meetingId && p.UserId == userId).ToListAsync();
                                _db.MeetingParticipants.RemoveRange(participants);
                                
                                var newHost = await _db.MeetingParticipants.FirstOrDefaultAsync(p => p.MeetingId == meetingId && p.UserId != userId);
                                if (newHost != null)
                                {
                                    meeting.HostId = newHost.UserId;
                                    newHost.Role = MeetVerse.Domain.Enums.MeetingParticipantRole.Host;
                                }
                                else
                                {
                                    meeting.Status = MeetVerse.Domain.Enums.MeetingStatus.Ended;
                                    meeting.ScheduledEnd = DateTime.UtcNow;
                                }
                                await _db.SaveChangesAsync();
                            }
                            else
                            {
                                var participants = await _db.MeetingParticipants.Where(p => p.MeetingId == meetingId && p.UserId == userId).ToListAsync();
                                if (participants.Any())
                                {
                                    _db.MeetingParticipants.RemoveRange(participants);
                                    await _db.SaveChangesAsync();
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        CustomLogger.Log($"Error processing participant_left webhook: {ex.Message}");
                    }
                    break;
                default:
                    CustomLogger.Log("default is hit");
                    break;
            }
            return Ok();
        }
        catch (Exception) { return Unauthorized(); }
    }
}
