using Livekit.Server.Sdk.Dotnet;
using MeetVerse.Api.Services.Background;

namespace MeetVerse.Api.Services;

public class LiveKitTokenService : ILiveKitTokenService
{
    private const string ApiKey = "APIVDmR6TG3FFHy";
    private const string ApiSecret = "ZSqPDDGXAVhsuqNuKfpsL8Og9TiahJt2A9rpJw67JJD";

    public string CreateToken(string username, string roomName)
    {
        var token = new AccessToken(ApiKey, ApiSecret)
            .WithIdentity(username)
            .WithGrants(new VideoGrants
            {
                RoomJoin = true,
                Room = roomName,
                CanPublish = true,
                CanSubscribe = true
            });

        return token.ToJwt();
    }
}
