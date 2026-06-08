namespace MeetVerse.Shared.Configuration;

public class MiroSettings
{
    public string BaseUrl { get; set; } = "https://api.miro.com/v2";
    public string AccessToken { get; set; } = default!;
}
