using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Persistence.Configurations;

public class TranscriptConfiguration : IEntityTypeConfiguration<Transcript>
{
    public void Configure(EntityTypeBuilder<Transcript> builder)
    {
        builder.HasMany(t => t.Lines)
            .WithOne(tl => tl.Transcript)
            .HasForeignKey(tl => tl.TranscriptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
