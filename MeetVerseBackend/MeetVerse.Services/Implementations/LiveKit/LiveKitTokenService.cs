using Livekit.Server.Sdk.Dotnet;
using MeetVerse.Abstraction.IServices;

namespace MeetVerse.Services.Implementations.LiveKit;

public class LiveKitTokenService : ILiveKitTokenService
{
    private const string ApiKey = "APIVDmR6TG3FFHy";
    private const string ApiSecret = "ZSqPDDGXAVhsuqNuKfpsL8Og9TiahJt2A9rpJw67JJD";

    public string CreateToken(string username, string roomName, string displayName, string? avatarUrl)
    {
        var metadata = System.Text.Json.JsonSerializer.Serialize(new
        {
            avatarUrl = avatarUrl ?? "",
        });

        var token = new AccessToken(ApiKey, ApiSecret)
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
