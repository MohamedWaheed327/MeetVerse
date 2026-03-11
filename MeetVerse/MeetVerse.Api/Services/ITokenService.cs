using MeetVerse.Api.Models;

namespace MeetVerse.Api.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user);
}


