
namespace MeetVerse.Api.Dtos;

public class CreateMeetingRequest
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public Guid? GroupId { get; set; } = new Guid("75E7F53E-5540-4747-A02A-B877C2FDC2F5");
}

public class JoinMeetingRequest
{
    public Guid Id { get; set; }
}

