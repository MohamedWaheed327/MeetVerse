using MeetVerse.Domain.Entities;

namespace MeetVerse.Abstraction.IServices;

public interface ITokenService
{
    string GenerateAccessToken(User user);
}
