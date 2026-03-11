namespace MeetVerse.Api.Dtos;

public class CreateGroupRequest
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
}

public class UpdateGroupRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class GroupResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public Guid CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public int MemberCount { get; set; }
    public string? CurrentUserRole { get; set; }
}

public class GroupMemberResponse
{
    public Guid UserId { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = default!;
    public DateTime JoinedAt { get; set; }
}

public class AddGroupMemberRequest
{
    public string Email { get; set; } = default!;
    public string Role { get; set; } = "member"; // member | admin
}

public class SetGroupMemberRoleRequest
{
    public string Role { get; set; } = default!; // member | admin | owner
}

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

public class SendGroupMessageRequest
{
    public string Content { get; set; } = default!;
}

public class CreateGroupMeetingRequest
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
}
