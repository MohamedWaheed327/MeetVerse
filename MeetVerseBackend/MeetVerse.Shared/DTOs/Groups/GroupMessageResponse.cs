namespace MeetVerse.Shared.DTOs.Groups;

public class GroupMessageResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid SenderId { get; set; }
    public string? SenderName { get; set; }
    public string? SenderAvatarUrl { get; set; }
    public string Content { get; set; } = default!;
    public DateTime SentAt { get; set; }
    public DateTime? EditedAt { get; set; }
}
