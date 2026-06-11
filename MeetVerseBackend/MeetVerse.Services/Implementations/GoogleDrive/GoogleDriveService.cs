using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using System.IO;
using Microsoft.Extensions.Logging;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Domain.Exceptions;
using MeetVerse.Shared.Common;
using MeetVerse.Shared.Constants;

namespace MeetVerse.Services.Implementations.GoogleDrive;

public class GoogleDriveService : IGoogleDriveService
{
    private readonly ILogger<GoogleDriveService> _logger;

    public GoogleDriveService(ILogger<GoogleDriveService> logger)
    {
        _logger = logger;
    }

    public async Task<DriveUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType, string googleAccessToken, CancellationToken ct = default)
    {
        var credential = GoogleCredential.FromAccessToken(googleAccessToken);

        using var driveService = new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = GoogleDriveConstants.ApplicationName
        });

        var folderId = await FindOrCreateFolderAsync(driveService, ct);

        var fileMetadata = new Google.Apis.Drive.v3.Data.File
        {
            Name = fileName,
            Parents = new[] { folderId }
        };

        var upload = driveService.Files.Create(fileMetadata, fileStream, contentType);
        upload.Fields = "id, name, webViewLink";

        var uploadResult = await upload.UploadAsync(ct);

        if (uploadResult.Exception != null)
        {
            _logger.LogError(uploadResult.Exception, "Google Drive upload failed for file {FileName}", fileName);
            throw new BadRequestException($"Google Drive upload failed: {uploadResult.Exception.Message}");
        }

        var uploadedFile = upload.ResponseBody;

        return new DriveUploadResult
        {
            DriveFileId = uploadedFile.Id,
            WebViewLink = uploadedFile.WebViewLink,
            FileName = uploadedFile.Name
        };
    }

    private static async Task<string> FindOrCreateFolderAsync(DriveService driveService, CancellationToken ct)
    {
        var listRequest = driveService.Files.List();
        listRequest.Q = $"name = '{GoogleDriveConstants.FolderName}' and mimeType = '{GoogleDriveConstants.FolderMimeType}' and trashed = false";
        listRequest.Fields = "files(id)";

        var result = await listRequest.ExecuteAsync(ct);

        if (result.Files != null && result.Files.Count > 0)
        {
            return result.Files[0].Id;
        }

        var folderMetadata = new Google.Apis.Drive.v3.Data.File
        {
            Name = GoogleDriveConstants.FolderName,
            MimeType = GoogleDriveConstants.FolderMimeType
        };

        var createRequest = driveService.Files.Create(folderMetadata);
        createRequest.Fields = "id";

        var folder = await createRequest.ExecuteAsync(ct);
        return folder.Id;
    }
}
