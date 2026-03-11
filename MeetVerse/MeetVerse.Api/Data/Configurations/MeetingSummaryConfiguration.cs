using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Data.Configurations;

public class MeetingSummaryConfiguration : IEntityTypeConfiguration<MeetingSummary>
{
    public void Configure(EntityTypeBuilder<MeetingSummary> builder)
    {
        builder.HasOne(ms => ms.Transcript)
            .WithOne(t => t.MeetingSummary)
            .HasForeignKey<MeetingSummary>(ms => ms.TranscriptId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
