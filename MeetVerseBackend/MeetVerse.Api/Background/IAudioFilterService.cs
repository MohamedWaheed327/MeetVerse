using MeetVerse.Api.Models;

namespace MeetVerse.Api.Services;

/// <summary>
/// Optional audio filtering (e.g. noise reduction, custom ML model) before transcription.
/// Implement this interface with your custom model and register it in DI to integrate.
/// </summary>
public interface IAudioFilterService
{
    /// <summary>
    /// Optionally filter/clean the recording audio. Returns the path to the filtered audio file,
    /// or null to use the original recording file path.
    /// </summary>
    /// <param name="recording">The recording (FilePath, SampleRate, etc.).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Path to filtered audio file, or null to skip filtering.</returns>
    Task<string?> FilterRecordingAsync(Recording recording, CancellationToken ct = default);
}
