using Microsoft.AspNetCore.Mvc;
using MeetVerse.Api.Services;
using MeetVerse.Api.Services.Background;
using Livekit.Server.Sdk.Dotnet;

namespace MeetVerse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LiveKitController : ControllerBase
{
    private const string ApiKey = "APIVDmR6TG3FFHy";
    private const string ApiSecret = "ZSqPDDGXAVhsuqNuKfpsL8Og9TiahJt2A9rpJw67JJD";

    private readonly ILiveKitTokenService _liveKitTokenService;

    public LiveKitController(ILiveKitTokenService liveKitTokenService)
    {
        _liveKitTokenService = liveKitTokenService;
    }

    [HttpGet("token")]
    public IActionResult GetToken([FromQuery] string username, [FromQuery] string room)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(room))
        {
            return BadRequest("username and room are required");
        }

        var token = _liveKitTokenService.CreateToken(username, room);

        return Ok(new { token });
    }


    [HttpPost("webhook")]
    public async Task<IActionResult> ReceiveWebhook()
    {
        // 1. Get the 'Authorization' header sent by LiveKit Cloud
        var authHeader = Request.Headers["Authorization"].ToString();

        // 2. Read the JSON body sent by LiveKit
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        try
        {
            // 3. Verify the signature so only LiveKit can trigger this
            var webhookReceiver = new WebhookReceiver(ApiKey, ApiSecret);
            var liveEvent = webhookReceiver.Receive(body, authHeader);

            // 4. Handle the sync logic
            switch (liveEvent.Event)
            {
                case "participant_joined":
                    // Logic: Mark user as "In Call" in your database
                    Console.WriteLine($"User {liveEvent.Participant.Identity} joined {liveEvent.Room.Name}");
                    break;

                case "participant_left":
                    // Logic: Mark user as "Away" or update call duration
                    Console.WriteLine($"User {liveEvent.Participant.Identity} left");
                    break;
            }

            return Ok();
        }
        catch (Exception)
        {
            // Verification failed (wrong secret or unauthorized sender)
            return Unauthorized();
        }
    }
}
