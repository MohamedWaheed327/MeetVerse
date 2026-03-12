using MeetVerse.Api.Models;

namespace MeetVerse.Api.Services.Background;

public interface ITokenService
{
    string GenerateAccessToken(User user);
}


