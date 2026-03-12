-- Migration: Add any remaining tables the app expects (Recordings, Transcripts, Whiteboard, etc.)
-- Run this if you get "Invalid object name 'X'" for any table

-- Recordings (depends on Meetings)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Recordings')
BEGIN
    CREATE TABLE Recordings (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        MeetingId UNIQUEIDENTIFIER NOT NULL,
        FilePath NVARCHAR(512) NOT NULL,
        DurationSeconds FLOAT NOT NULL,
        SampleRate INT NOT NULL,
        SizeBytes BIGINT NOT NULL,
        IsNoiseCleaned BIT NOT NULL,
        AverageNoiseLevel FLOAT NULL,
        Status NVARCHAR(32) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Recordings_Meetings_MeetingId FOREIGN KEY (MeetingId) REFERENCES Meetings(Id)
    );
END
GO

-- Transcripts (depends on Meetings, Recordings)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Transcripts')
BEGIN
    CREATE TABLE Transcripts (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        MeetingId UNIQUEIDENTIFIER NOT NULL UNIQUE,
        RecordingId UNIQUEIDENTIFIER NOT NULL UNIQUE,
        Provider NVARCHAR(64) NOT NULL,
        Language NVARCHAR(32) NULL,
        Status NVARCHAR(32) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Transcripts_Meetings_MeetingId FOREIGN KEY (MeetingId) REFERENCES Meetings(Id),
        CONSTRAINT FK_Transcripts_Recordings_RecordingId FOREIGN KEY (RecordingId) REFERENCES Recordings(Id)
    );
END
GO

-- TranscriptLines (depends on Transcripts, Users)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TranscriptLines')
BEGIN
    CREATE TABLE TranscriptLines (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TranscriptId UNIQUEIDENTIFIER NOT NULL,
        StartTimeSeconds FLOAT NOT NULL,
        EndTimeSeconds FLOAT NOT NULL,
        SpeakerUserId UNIQUEIDENTIFIER NULL,
        SpeakerLabel NVARCHAR(64) NULL,
        Text NVARCHAR(MAX) NOT NULL,
        CONSTRAINT FK_TranscriptLines_Transcripts_TranscriptId FOREIGN KEY (TranscriptId) REFERENCES Transcripts(Id),
        CONSTRAINT FK_TranscriptLines_Users_SpeakerUserId FOREIGN KEY (SpeakerUserId) REFERENCES Users(Id)
    );
END
GO

-- MeetingSummaries (depends on Meetings, Transcripts)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MeetingSummaries')
BEGIN
    CREATE TABLE MeetingSummaries (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        MeetingId UNIQUEIDENTIFIER NOT NULL UNIQUE,
        TranscriptId UNIQUEIDENTIFIER NOT NULL,
        SummaryText NVARCHAR(MAX) NOT NULL,
        KeyDecisionsJson NVARCHAR(MAX) NULL,
        ActionItemsJson NVARCHAR(MAX) NULL,
        GeneratedBy NVARCHAR(64) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_MeetingSummaries_Meetings_MeetingId FOREIGN KEY (MeetingId) REFERENCES Meetings(Id),
        CONSTRAINT FK_MeetingSummaries_Transcripts_TranscriptId FOREIGN KEY (TranscriptId) REFERENCES Transcripts(Id)
    );
END
GO
