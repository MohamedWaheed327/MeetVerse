using MeetVerse.Api.Models;

namespace MeetVerse.Api.Services;

public interface IAudioTranscriptionService
{
    /// <param name="filteredAudioPath">Optional path to pre-filtered audio (e.g. from IAudioFilterService). If null, use recording.FilePath.</param>
    Task<Transcript> TranscribeRecordingAsync(Recording recording, string? filteredAudioPath = null, CancellationToken ct = default);
}


