-- Migration: Add Groups, UserGroups, GroupMessages and Meeting.GroupId
-- Run this against your existing database if you get "Invalid column name 'GroupId'" error

-- 1. Create Groups table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Groups')
BEGIN
    CREATE TABLE Groups (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        Name NVARCHAR(256) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedById UNIQUEIDENTIFIER NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Groups_Users_CreatedById FOREIGN KEY (CreatedById) REFERENCES Users(Id)
    );
END
GO

-- 2. Create UserGroups table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserGroups')
BEGIN
    CREATE TABLE UserGroups (
        UserId UNIQUEIDENTIFIER NOT NULL,
        GroupId UNIQUEIDENTIFIER NOT NULL,
        Role NVARCHAR(32) NOT NULL,
        JoinedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_UserGroups PRIMARY KEY (UserId, GroupId),
        CONSTRAINT FK_UserGroups_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id),
        CONSTRAINT FK_UserGroups_Groups_GroupId FOREIGN KEY (GroupId) REFERENCES Groups(Id)
    );
END
GO

-- 3. Create GroupMessages table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroupMessages')
BEGIN
    CREATE TABLE GroupMessages (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        GroupId UNIQUEIDENTIFIER NOT NULL,
        SenderId UNIQUEIDENTIFIER NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        SentAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        EditedAt DATETIME2 NULL,
        DeletedAt DATETIME2 NULL,
        CONSTRAINT FK_GroupMessages_Groups_GroupId FOREIGN KEY (GroupId) REFERENCES Groups(Id),
        CONSTRAINT FK_GroupMessages_Users_SenderId FOREIGN KEY (SenderId) REFERENCES Users(Id)
    );
END
GO

-- 4. Add GroupId column to Meetings (if not exists)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Meetings') AND name = 'GroupId')
BEGIN
    ALTER TABLE Meetings ADD GroupId UNIQUEIDENTIFIER NULL;
    ALTER TABLE Meetings ADD CONSTRAINT FK_Meetings_Groups_GroupId FOREIGN KEY (GroupId) REFERENCES Groups(Id);
END
GO

-- 5. Create indexes (if not exist)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GroupMessages_GroupId' AND object_id = OBJECT_ID('GroupMessages'))
    CREATE INDEX IX_GroupMessages_GroupId ON GroupMessages(GroupId);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GroupMessages_SentAt' AND object_id = OBJECT_ID('GroupMessages'))
    CREATE INDEX IX_GroupMessages_SentAt ON GroupMessages(SentAt);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Meetings_GroupId' AND object_id = OBJECT_ID('Meetings'))
    CREATE INDEX IX_Meetings_GroupId ON Meetings(GroupId);
GO
