namespace MeetVerse.Domain.Exceptions;

public class ForbiddenException : Exception
{
    public ForbiddenException() : base("Access is forbidden.") { }

    public ForbiddenException(string message) : base(message) { }
}
