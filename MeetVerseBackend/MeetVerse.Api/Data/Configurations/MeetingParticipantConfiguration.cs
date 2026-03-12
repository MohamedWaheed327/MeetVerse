using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Data.Configurations;

public class MeetingParticipantConfiguration : IEntityTypeConfiguration<MeetingParticipant>
{
    public void Configure(EntityTypeBuilder<MeetingParticipant> builder)
    {
        builder.Property(mp => mp.Role)
            .HasConversion<string>();
    }
}
