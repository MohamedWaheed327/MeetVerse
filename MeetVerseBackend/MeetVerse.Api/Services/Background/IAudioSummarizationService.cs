using MeetVerse.Api.Models;

namespace MeetVerse.Api.Services.Background;

public interface IAudioSummarizationService
{
    Task<MeetingSummary> GenerateSummaryAsync(Transcript transcript, CancellationToken ct = default);
}


