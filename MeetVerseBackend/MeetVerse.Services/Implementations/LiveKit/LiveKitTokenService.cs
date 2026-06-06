using Livekit.Server.Sdk.Dotnet;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Shared.Configuration;
using Microsoft.Extensions.Options;

namespace MeetVerse.Services.Implementations.LiveKit;

public class LiveKitTokenService : ILiveKitTokenService
{
    private readonly LiveKitSettings _settings;

    public LiveKitTokenService(IOptions<LiveKitSettings> settings)
    {
        _settings = settings.Value;
    }

    public string CreateToken(string username, string roomName, string displayName, string? avatarUrl)
    {
        var metadata = System.Text.Json.JsonSerializer.Serialize(new
        {
            avatarUrl = avatarUrl ?? "",
        });

        var token = new AccessToken(_settings.ApiKey, _settings.ApiSecret)
            .WithIdentity(username)
            .WithGrants(new VideoGrants
            {
                RoomJoin = true,
                Room = roomName,
                CanPublish = true,
                CanSubscribe = true
            })
            .WithName(displayName)
            .WithMetadata(metadata);

        return token.ToJwt();
    }
}
