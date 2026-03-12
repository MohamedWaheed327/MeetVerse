-- Migration: Add NoiseProfiles, NoiseEvents, NoiseReports, EngagementMetrics, and NoiseProfileId on Users
-- Run this if you get "Invalid object name 'NoiseReports'" or similar

-- 1. Add NoiseProfileId to Users (if not exists)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'NoiseProfileId')
BEGIN
    ALTER TABLE Users ADD NoiseProfileId UNIQUEIDENTIFIER NULL;
END
GO

-- 2. Create NoiseProfiles table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NoiseProfiles')
BEGIN
    CREATE TABLE NoiseProfiles (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        UserId UNIQUEIDENTIFIER NOT NULL UNIQUE,
        ProfileDataJson NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_NoiseProfiles_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
END
GO

-- 3. Create NoiseEvents table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NoiseEvents')
BEGIN
    CREATE TABLE NoiseEvents (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        MeetingId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,
        Timestamp DATETIME2 NOT NULL,
        EventType NVARCHAR(64) NOT NULL,
        Intensity FLOAT NOT NULL,
        FrequencyBand NVARCHAR(64) NULL,
        RawMetricsJson NVARCHAR(MAX) NULL,
        CONSTRAINT FK_NoiseEvents_Meetings_MeetingId FOREIGN KEY (MeetingId) REFERENCES Meetings(Id),
        CONSTRAINT FK_NoiseEvents_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
END
GO

-- 4. Create NoiseReports table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NoiseReports')
BEGIN
    CREATE TABLE NoiseReports (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        MeetingId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,
        AvgClarityScore FLOAT NOT NULL,
        AvgNoiseLevel FLOAT NOT NULL,
        PeakNoiseLevel FLOAT NOT NULL,
        NoiseEventsCount INT NOT NULL,
        SpeakingTimeSeconds FLOAT NOT NULL,
        SegmentsJson NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_NoiseReports_Meetings_MeetingId FOREIGN KEY (MeetingId) REFERENCES Meetings(Id),
        CONSTRAINT FK_NoiseReports_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
END
GO

-- 5. Create EngagementMetrics table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EngagementMetrics')
BEGIN
    CREATE TABLE EngagementMetrics (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        MeetingId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,
        TotalSpeakingTimeSeconds FLOAT NOT NULL,
        MessagesSent INT NOT NULL,
        ReactionsCount INT NOT NULL,
        HandRaises INT NOT NULL,
        ScreenShareDurationSeconds FLOAT NOT NULL,
        LastActiveAt DATETIME2 NULL,
        CONSTRAINT FK_EngagementMetrics_Meetings_MeetingId FOREIGN KEY (MeetingId) REFERENCES Meetings(Id),
        CONSTRAINT FK_EngagementMetrics_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
END
GO
