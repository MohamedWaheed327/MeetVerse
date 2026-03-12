namespace MeetVerse.Api.Services.Background;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string hash, string password);
}


