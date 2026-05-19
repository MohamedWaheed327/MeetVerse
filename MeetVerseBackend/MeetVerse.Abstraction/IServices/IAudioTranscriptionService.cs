using MeetVerse.Domain.Entities;

namespace MeetVerse.Abstraction.IServices;

public interface IAudioTranscriptionService
{
    /// <param name="filteredAudioPath">Optional path to pre-filtered audio. If null, use recording.FilePath.</param>
    Task<Transcript> TranscribeRecordingAsync(Recording recording, string? filteredAudioPath = null, CancellationToken ct = default);
}
