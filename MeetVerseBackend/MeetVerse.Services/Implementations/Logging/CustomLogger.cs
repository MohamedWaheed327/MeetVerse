namespace MeetVerse.Services.Implementations.Logging;

public static class CustomLogger
{
    public static void Log(string message)
    {
        Console.WriteLine($"[CustomLogger]: {message}");
    }
}
