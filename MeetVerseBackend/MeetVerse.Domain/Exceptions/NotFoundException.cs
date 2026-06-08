namespace MeetVerse.Domain.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException() : base("The requested resource was not found.") { }

    public NotFoundException(string message) : base(message) { }

    public NotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found.") { }
}
