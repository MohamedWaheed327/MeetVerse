namespace MeetVerse.Shared.Configuration;

public class SmtpSettings
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = default!;
    public string AppPassword { get; set; } = default!;
    public string FromName { get; set; } = "MeetVerse";
}
