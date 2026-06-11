using System.IO;
using MeetVerse.Shared.Common;

namespace MeetVerse.Abstraction.IServices;

public interface IGoogleDriveService
{
    Task<DriveUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType, string googleAccessToken, CancellationToken ct = default);
}
