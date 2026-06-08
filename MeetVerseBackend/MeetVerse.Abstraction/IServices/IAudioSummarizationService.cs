using MeetVerse.Domain.Entities;

namespace MeetVerse.Abstraction.IServices;

public interface IAudioSummarizationService
{
    Task<MeetingSummary> GenerateSummaryAsync(Transcript transcript, CancellationToken ct = default);
}
