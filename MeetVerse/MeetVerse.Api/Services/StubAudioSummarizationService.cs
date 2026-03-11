using MeetVerse.Api.Models;

namespace MeetVerse.Api.Services;

/// <summary>
/// Stub implementation. Replace with real GPT-4 or similar LLM calls.
/// </summary>
public class StubAudioSummarizationService : IAudioSummarizationService
{
    public Task<MeetingSummary> GenerateSummaryAsync(Transcript transcript, CancellationToken ct = default)
    {
        var summary = new MeetingSummary
        {
            Id = Guid.NewGuid(),
            MeetingId = transcript.MeetingId,
            TranscriptId = transcript.Id,
            SummaryText = "This is a stub summary. Replace with GPT-4 generated content.",
            KeyDecisionsJson = "[\"Decision 1\"]",
            ActionItemsJson = "[\"Action item 1\"]"
        };

        return Task.FromResult(summary);
    }
}


