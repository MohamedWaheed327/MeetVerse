namespace MeetVerse.Api.Configuration;

public class JwtSettings
{
    public string Issuer { get; set; } = "MeetVerse";
    public string Audience { get; set; } = "MeetVerseWeb";
    public string Key { get; set; } = "DEVELOPMENT_SECRET_CHANGE_ME";
    public int AccessTokenMinutes { get; set; } = 60;
}


