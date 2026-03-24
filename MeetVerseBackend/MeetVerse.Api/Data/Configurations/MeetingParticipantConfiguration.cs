using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Data.Configurations;

// TODO: add the commented constraint
public class MeetingParticipantConfiguration : IEntityTypeConfiguration<MeetingParticipant>
{
    public void Configure(EntityTypeBuilder<MeetingParticipant> builder)
    {
        builder.Property(mp => mp.Role)
            .HasConversion<string>();
        // builder.HasIndex(p => new { p.UserId, p.MeetingId })
        //     .IsUnique();
    }
}
