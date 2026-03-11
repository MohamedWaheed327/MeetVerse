using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Data.Configurations;

public class RecordingConfiguration : IEntityTypeConfiguration<Recording>
{
    public void Configure(EntityTypeBuilder<Recording> builder)
    {
        // one-to-one backward ref is handled by TranscriptConfiguration
    }
}
