using Microsoft.EntityFrameworkCore;
using MeetVerse.Domain.Contracts;
using MeetVerse.Domain.Entities;
using MeetVerse.Domain.Enums;
using MeetVerse.Persistence.Data;

namespace MeetVerse.Persistence.Seeds;

public class DatabaseSeeder : IDatabaseSeeder
{
    private readonly MeetVerseDbContext _db;

    public DatabaseSeeder(MeetVerseDbContext db)
    {
        _db = db;
    }

    public async Task SeedAsync()
    {
        if (_db.Database.IsRelational())
        {
            await _db.Database.MigrateAsync();
            await EnsurePasswordResetTableAsync();
            await EnsureLatestSchemaAsync();
        }

        if (_db.Users.Any())
        {
            return;
        }

        var admin = new User
        {
            Id = new Guid("11111111-1111-1111-1111-111111111111"),
            Email = "admin@meetverse.com",
            PasswordHash = "stub",
            Name = "MeetVerse Admin",
            Roles = UserRole.Admin
        };

        _db.Users.AddRange(admin);

        var demoGroup = new Group
        {
            Id = new Guid("11111111-1111-1111-1111-111111111111"),
            Name = "MeetVerse Community",
            Description = "Group for MeetVerse Members",
            CreatedById = admin.Id,
            CreatedAt = DateTime.UtcNow
        };
        _db.Groups.Add(demoGroup);
        _db.UserGroups.Add(new UserGroup { UserId = admin.Id, GroupId = demoGroup.Id, Role = GroupMemberRole.Owner, JoinedAt = DateTime.UtcNow });

        await _db.SaveChangesAsync();
    }

    private async Task EnsurePasswordResetTableAsync()
    {
        await _db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID(N'[dbo].[PasswordResetRequests]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[PasswordResetRequests] (
                    [Id] uniqueidentifier NOT NULL,
                    [Email] nvarchar(256) NOT NULL,
                    [CodeHash] nvarchar(128) NOT NULL,
                    [ExpiresAtUtc] datetime2 NOT NULL,
                    [CreatedAtUtc] datetime2 NOT NULL,
                    [IsUsed] bit NOT NULL,
                    CONSTRAINT [PK_PasswordResetRequests] PRIMARY KEY ([Id])
                );
                CREATE INDEX [IX_PasswordResetRequests_Email_IsUsed_ExpiresAtUtc]
                    ON [dbo].[PasswordResetRequests] ([Email], [IsUsed], [ExpiresAtUtc]);
            END
            """);
    }

    private async Task EnsureLatestSchemaAsync()
    {
        await _db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'CoverGradient' AND Object_ID = Object_ID(N'[dbo].[Groups]'))
            BEGIN
                ALTER TABLE [dbo].[Groups] ADD [CoverGradient] nvarchar(max) NULL;
            END

            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'IsPublic' AND Object_ID = Object_ID(N'[dbo].[Groups]'))
            BEGIN
                ALTER TABLE [dbo].[Groups] ADD [IsPublic] bit NOT NULL DEFAULT 0;
            END

            IF OBJECT_ID(N'[dbo].[JoinGroupRequests]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[JoinGroupRequests] (
                    [Id] uniqueidentifier NOT NULL,
                    [UserId] uniqueidentifier NOT NULL,
                    [GroupId] uniqueidentifier NOT NULL,
                    CONSTRAINT [PK_JoinGroupRequests] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_JoinGroupRequests_Groups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [dbo].[Groups] ([Id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_JoinGroupRequests_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id])
                );
                CREATE INDEX [IX_JoinGroupRequests_GroupId] ON [dbo].[JoinGroupRequests] ([GroupId]);
                CREATE INDEX [IX_JoinGroupRequests_UserId] ON [dbo].[JoinGroupRequests] ([UserId]);
            END

            IF OBJECT_ID(N'[dbo].[WhiteboardSessions]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[WhiteboardSessions] (
                    [Id] uniqueidentifier NOT NULL,
                    [MeetingId] uniqueidentifier NOT NULL,
                    [StartedAt] datetime2 NOT NULL,
                    [EndedAt] datetime2 NULL,
                    [MiroBoardId] nvarchar(max) NULL,
                    [MiroBoardViewUrl] nvarchar(max) NULL,
                    CONSTRAINT [PK_WhiteboardSessions] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_WhiteboardSessions_Meetings_MeetingId] FOREIGN KEY ([MeetingId]) REFERENCES [dbo].[Meetings] ([Id]) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX [IX_WhiteboardSessions_MeetingId] ON [dbo].[WhiteboardSessions] ([MeetingId]);
            END

            IF OBJECT_ID(N'[dbo].[WhiteboardEvents]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[WhiteboardEvents] (
                    [Id] uniqueidentifier NOT NULL,
                    [SessionId] uniqueidentifier NOT NULL,
                    [UserId] uniqueidentifier NOT NULL,
                    [Type] nvarchar(max) NOT NULL,
                    [PayloadJson] nvarchar(max) NOT NULL,
                    [CreatedAt] datetime2 NOT NULL,
                    CONSTRAINT [PK_WhiteboardEvents] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_WhiteboardEvents_WhiteboardSessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [dbo].[WhiteboardSessions] ([Id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_WhiteboardEvents_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id])
                );
                CREATE INDEX [IX_WhiteboardEvents_SessionId] ON [dbo].[WhiteboardEvents] ([SessionId]);
                CREATE INDEX [IX_WhiteboardEvents_UserId] ON [dbo].[WhiteboardEvents] ([UserId]);
            END
            """);
    }
}
