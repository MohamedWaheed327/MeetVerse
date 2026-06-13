using System.ComponentModel.DataAnnotations;

namespace MeetVerse.Shared.DTOs.Meetings;

public class UpdateMeetingRequest
{
    [MaxLength(100, ErrorMessage = "Meeting title cannot exceed 100 characters.")]
    public string? Title { get; set; }

    [MaxLength(500, ErrorMessage = "Meeting description cannot exceed 500 characters.")]
    public string? Description { get; set; }

    public DateTime? ScheduledStart { get; set; }
}
