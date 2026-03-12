using MeetVerse.Api.Models;

namespace MeetVerse.Api.Services;

/// <summary>
/// No-op filter. Replace with your custom audio filtering model implementation.
/// </summary>
public class StubAudioFilterService : IAudioFilterService
{
    public Task<string?> FilterRecordingAsync(Recording recording, CancellationToken ct = default)
        => Task.FromResult<string?>(null);
}
