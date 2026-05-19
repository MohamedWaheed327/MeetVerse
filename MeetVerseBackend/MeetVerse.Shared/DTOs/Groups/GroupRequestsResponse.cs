namespace MeetVerse.Shared.DTOs.Groups;

public class GroupRequestsResponse
{
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = default!;
    public string SenderEmail { get; set; } = default!;
    public DateTime SentAt { get; set; }
}
