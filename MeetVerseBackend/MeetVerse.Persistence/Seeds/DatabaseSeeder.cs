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
}
