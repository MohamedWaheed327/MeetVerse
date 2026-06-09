using System;
using MeetVerse.Abstraction.IServices;
using Microsoft.AspNetCore.Http;

namespace MeetVerse.Services.Implementations.Profile;

public class ImageResolver : IImageResolver
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ImageResolver(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string ResolveAvatarUrl(string? relativePath)
    {
        if (string.IsNullOrEmpty(relativePath)) return string.Empty;
        
        // If it's already a full URL (like Google photo), return as is
        if (relativePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
            relativePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return relativePath;
        }

        var request = _httpContextAccessor.HttpContext?.Request;
        if (request == null) return relativePath;

        var baseUrl = $"{request.Scheme}://{request.Host}";
        return $"{baseUrl}/{relativePath.TrimStart('/')}";
    }
}
