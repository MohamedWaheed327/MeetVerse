using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Shared.DTOs.Recordings;

namespace MeetVerse.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecordingsController : ControllerBase
{
    private readonly IGoogleDriveService _googleDriveService;

    public RecordingsController(IGoogleDriveService googleDriveService)
    {
        _googleDriveService = googleDriveService;
    }

    [HttpPost("upload-to-drive")]
    public async Task<IActionResult> UploadToDrive([FromForm] IFormFile file, [FromForm] string googleAccessToken, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No recording file was provided.");
        }

        if (string.IsNullOrWhiteSpace(googleAccessToken))
        {
            return BadRequest("Google access token is required.");
        }

        await using var stream = file.OpenReadStream();
        var result = await _googleDriveService.UploadAsync(stream, file.FileName, file.ContentType, googleAccessToken, ct);

        var response = new UploadToDriveResponse(result.DriveFileId, result.WebViewLink, result.FileName);

        return Ok(response);
    }
}
