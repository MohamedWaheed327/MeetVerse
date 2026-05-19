using MeetVerse.Abstraction.IServices;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Services.Implementations.Audio;

/// <summary>
/// No-op filter. Replace with your custom audio filtering model implementation.
/// </summary>
public class StubAudioFilterService : IAudioFilterService
{
    public Task<string?> FilterRecordingAsync(Recording recording, CancellationToken ct = default)
        => Task.FromResult<string?>(null);
}
