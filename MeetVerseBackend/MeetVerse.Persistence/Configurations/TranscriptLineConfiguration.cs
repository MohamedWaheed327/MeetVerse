using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Persistence.Configurations;

public class TranscriptLineConfiguration : IEntityTypeConfiguration<TranscriptLine>
{
    public void Configure(EntityTypeBuilder<TranscriptLine> builder)
    {
        builder.Property(tl => tl.Text).IsRequired();
    }
}
