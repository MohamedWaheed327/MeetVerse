using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Data.Configurations;

public class MeetingConfiguration : IEntityTypeConfiguration<Meeting>
{
    public void Configure(EntityTypeBuilder<Meeting> builder)
    {
        builder.Property(m => m.Status)
            .HasConversion<string>();

        builder.HasOne(m => m.Group)
            .WithMany(g => g.Meetings)
            .HasForeignKey(m => m.GroupId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(m => m.Participants)
            .WithOne(mp => mp.Meeting)
            .HasForeignKey(mp => mp.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(m => m.ChatMessages)
            .WithOne(cm => cm.Meeting)
            .HasForeignKey(cm => cm.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(m => m.WhiteboardSessions)
            .WithOne(ws => ws.Meeting)
            .HasForeignKey(ws => ws.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(m => m.Recordings)
            .WithOne(r => r.Meeting)
            .HasForeignKey(r => r.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(m => m.EngagementMetrics)
            .WithOne(em => em.Meeting)
            .HasForeignKey(em => em.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Transcript)
            .WithOne(t => t.Meeting)
            .HasForeignKey<Transcript>(t => t.MeetingId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.MeetingSummary)
            .WithOne(ms => ms.Meeting)
            .HasForeignKey<MeetingSummary>(ms => ms.MeetingId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
