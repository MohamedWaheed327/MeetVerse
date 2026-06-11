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
    public async Task<IActionResult> UploadToDrive([FromForm] UploadToDriveRequestDto request, CancellationToken ct)
    {
        if (request.File == null || request.File.Length == 0)
        {
            return BadRequest("No recording file was provided.");
        }

        if (string.IsNullOrWhiteSpace(request.GoogleAccessToken))
        {
            return BadRequest("Google access token is required.");
        }

        await using var stream = request.File.OpenReadStream();
        var result = await _googleDriveService.UploadAsync(stream, request.File.FileName, request.File.ContentType, request.GoogleAccessToken, ct);

        var response = new UploadToDriveResponse(result.DriveFileId, result.WebViewLink, result.FileName);

        return Ok(response);
    }
}

public class UploadToDriveRequestDto
{
    public IFormFile File { get; set; } = null!;
    public string GoogleAccessToken { get; set; } = string.Empty;
}
