using MeetVerse.Domain.Entities;

namespace MeetVerse.Abstraction.IServices;

/// <summary>
/// Optional audio filtering (e.g. noise reduction, custom ML model) before transcription.
/// </summary>
public interface IAudioFilterService
{
    /// <summary>
    /// Optionally filter/clean the recording audio. Returns the path to the filtered audio file,
    /// or null to use the original recording file path.
    /// </summary>
    Task<string?> FilterRecordingAsync(Recording recording, CancellationToken ct = default);
}
