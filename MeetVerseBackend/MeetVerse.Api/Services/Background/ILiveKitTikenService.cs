namespace MeetVerse.Api.Services.Background;

public interface ILiveKitTokenService
{
    string CreateToken(string username, string roomName, string displayName, string avatarUrl);
}
