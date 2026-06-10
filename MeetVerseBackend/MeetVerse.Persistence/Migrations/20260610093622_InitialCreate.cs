using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetVerse.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
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
                CREATE INDEX [IX_WhiteboardSessions_MeetingId] ON [dbo].[WhiteboardSessions] ([MeetingId]);
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
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
