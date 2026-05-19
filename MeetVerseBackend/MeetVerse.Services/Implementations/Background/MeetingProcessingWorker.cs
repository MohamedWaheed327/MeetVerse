using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Persistence.Data;

namespace MeetVerse.Services.Implementations.Background;

public class MeetingProcessingWorker : BackgroundService
{
    private readonly IServiceProvider _services;

    public MeetingProcessingWorker(IServiceProvider services)
    {
        _services = services;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<MeetVerseDbContext>();
                var filter = scope.ServiceProvider.GetRequiredService<IAudioFilterService>();
                var transcription = scope.ServiceProvider.GetRequiredService<IAudioTranscriptionService>();
                var summarization = scope.ServiceProvider.GetRequiredService<IAudioSummarizationService>();

                var pendingRecordings = await db.Recordings
                    .Where(r => !db.Transcripts.Any(t => t.RecordingId == r.Id))
                    .ToListAsync(stoppingToken);

                foreach (var recording in pendingRecordings)
                {
                    string? filteredPath = await filter.FilterRecordingAsync(recording, stoppingToken);
                    var transcript = await transcription.TranscribeRecordingAsync(recording, filteredPath, stoppingToken);
                    db.Transcripts.Add(transcript);
                    await db.SaveChangesAsync(stoppingToken);

                    var summary = await summarization.GenerateSummaryAsync(transcript, stoppingToken);
                    db.MeetingSummaries.Add(summary);
                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MeetingProcessingWorker] Error: {ex.Message}");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
