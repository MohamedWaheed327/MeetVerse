using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MeetVerse.Abstraction.IServices;
using Microsoft.AspNetCore.Hosting;

namespace MeetVerse.Services.Implementations.Profile;

public class LocalImageStorageService : IImageStorageService
{
    private readonly IWebHostEnvironment _env;

    public LocalImageStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> SaveImageAsync(Stream fileStream, string username, string originalFileName)
    {
        var sanitizedFolder = SanitizeFolderName(username);
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension)) extension = ".jpg";

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        
        // Define path: avatars/username/unique-id.ext
        var relativeDir = Path.Combine("avatars", sanitizedFolder);
        var absoluteDir = Path.Combine(_env.WebRootPath, relativeDir);
        
        if (!Directory.Exists(absoluteDir))
        {
            Directory.CreateDirectory(absoluteDir);
        }

        var absolutePath = Path.Combine(absoluteDir, uniqueFileName);
        
        using (var outputStream = new FileStream(absolutePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await fileStream.CopyToAsync(outputStream);
        }

        // Return forward slash relative URL: avatars/username/filename.ext
        return $"avatars/{sanitizedFolder}/{uniqueFileName}";
    }

    public Task DeleteImageAsync(string relativePath)
    {
        if (string.IsNullOrEmpty(relativePath)) return Task.CompletedTask;

        // Skip absolute URLs (e.g. Google photos)
        if (relativePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
            relativePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        var normalizedPath = relativePath.Replace('/', Path.DirectorySeparatorChar);
        var absolutePath = Path.Combine(_env.WebRootPath, normalizedPath);

        if (File.Exists(absolutePath))
        {
            try
            {
                File.Delete(absolutePath);
            }
            catch
            {
                // Swallow file deletion exceptions (e.g. if file is locked)
            }
        }

        return Task.CompletedTask;
    }

    private static string SanitizeFolderName(string input)
    {
        if (string.IsNullOrEmpty(input)) return "default";
        
        // Convert to lowercase
        var result = input.ToLowerInvariant();
        
        // Replace spaces and plus signs with hyphens
        result = result.Replace(" ", "-").Replace("+", "-");
        
        // Keep only letters, numbers, hyphens, and underscores
        var sb = new StringBuilder();
        foreach (var c in result)
        {
            if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' || c == '_')
            {
                sb.Append(c);
            }
        }
        
        var cleaned = sb.ToString();
        while (cleaned.Contains("--"))
        {
            cleaned = cleaned.Replace("--", "-");
        }
        
        return cleaned.Trim('-');
    }
}
