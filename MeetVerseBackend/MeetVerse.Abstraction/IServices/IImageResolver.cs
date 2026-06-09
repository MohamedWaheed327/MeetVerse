namespace MeetVerse.Abstraction.IServices;

public interface IImageResolver
{
    string ResolveAvatarUrl(string? relativePath);
}
