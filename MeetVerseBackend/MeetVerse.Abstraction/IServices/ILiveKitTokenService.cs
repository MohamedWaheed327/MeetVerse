namespace MeetVerse.Abstraction.IServices;

public interface ILiveKitTokenService
{
    string CreateToken(string username, string roomName, string displayName, string? avatarUrl);
}
