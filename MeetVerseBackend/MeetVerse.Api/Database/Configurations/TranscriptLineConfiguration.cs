using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Database.Configurations;

public class TranscriptLineConfiguration : IEntityTypeConfiguration<TranscriptLine>
{
    public void Configure(EntityTypeBuilder<TranscriptLine> builder)
    {
        // One-to-many relationship with Transcript is configured in TranscriptConfiguration
    }
}
