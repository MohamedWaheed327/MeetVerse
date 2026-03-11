namespace MeetVerse.Api.Models;

public enum UserRole
{
    User = 0,
    Participant = 1,
    Admin = 2,
    Host = 3
}

public enum MeetingStatus
{
    Scheduled = 0,
    Live = 1,
    Ended = 2
}

public enum MeetingParticipantRole
{
    Participant = 0,
    Host = 1
}

public enum GroupMemberRole
{
    Member = 0,
    Admin = 1,
    Owner = 2
}

