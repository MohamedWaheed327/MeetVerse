using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Database.Configurations;

public class TranscriptConfiguration : IEntityTypeConfiguration<Transcript>
{
    public void Configure(EntityTypeBuilder<Transcript> builder)
    {
        builder.HasOne(t => t.Recording)
            .WithOne(r => r.Transcript!)
            .HasForeignKey<Transcript>(t => t.RecordingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Lines)
            .WithOne(tl => tl.Transcript)
            .HasForeignKey(tl => tl.TranscriptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
