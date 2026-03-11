using MeetVerse.Api.Models;

namespace MeetVerse.Api.Services;

/// <summary>
/// Stub implementation. Replace HTTP calls with real OpenAI Whisper / AssemblyAI integration.
/// </summary>
public class StubAudioTranscriptionService : IAudioTranscriptionService
{
    public Task<Transcript> TranscribeRecordingAsync(Recording recording, string? filteredAudioPath = null, CancellationToken ct = default)
    {
        var transcript = new Transcript
        {
            Id = Guid.NewGuid(),
            MeetingId = recording.MeetingId,
            RecordingId = recording.Id,
            Provider = "stub-whisper",
            Status = "completed",
            Lines = new List<TranscriptLine>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    StartTimeSeconds = 0,
                    EndTimeSeconds = recording.DurationSeconds,
                    SpeakerLabel = "Speaker 1",
                    Text = "This is a stub transcript line. Replace with real Whisper output."
                }
            }
        };

        return Task.FromResult(transcript);
    }
}


