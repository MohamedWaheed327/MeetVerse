using Microsoft.EntityFrameworkCore;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Database;

public class MeetVerseDbContext : DbContext
{
    public MeetVerseDbContext(DbContextOptions<MeetVerseDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<MeetingParticipant> MeetingParticipants => Set<MeetingParticipant>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<WhiteboardSession> WhiteboardSessions => Set<WhiteboardSession>();
    public DbSet<WhiteboardEvent> WhiteboardEvents => Set<WhiteboardEvent>();
    public DbSet<Recording> Recordings => Set<Recording>();
    public DbSet<Transcript> Transcripts => Set<Transcript>();
    public DbSet<TranscriptLine> TranscriptLines => Set<TranscriptLine>();
    public DbSet<MeetingSummary> MeetingSummaries => Set<MeetingSummary>();
    public DbSet<EngagementMetric> EngagementMetrics => Set<EngagementMetric>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<UserGroup> UserGroups => Set<UserGroup>();
    public DbSet<GroupMessage> GroupMessages => Set<GroupMessage>();
    public DbSet<JoinGroupRequest> JoinGroupRequests => Set<JoinGroupRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MeetVerseDbContext).Assembly);
    }
}


