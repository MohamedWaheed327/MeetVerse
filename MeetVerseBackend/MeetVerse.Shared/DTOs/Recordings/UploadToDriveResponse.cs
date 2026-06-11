namespace MeetVerse.Shared.DTOs.Recordings;

public record UploadToDriveResponse(
    string DriveFileId,
    string WebViewLink,
    string FileName);
