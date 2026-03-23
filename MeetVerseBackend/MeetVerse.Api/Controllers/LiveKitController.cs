using Microsoft.AspNetCore.Mvc;
using MeetVerse.Api.Services;
using MeetVerse.Api.Services.Background;

namespace MeetVerse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LiveKitController : ControllerBase
    {
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
    }
}