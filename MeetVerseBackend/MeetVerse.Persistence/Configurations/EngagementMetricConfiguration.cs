using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Persistence.Configurations;

public class EngagementMetricConfiguration : IEntityTypeConfiguration<EngagementMetric>
{
    public void Configure(EntityTypeBuilder<EngagementMetric> builder)
    {
        builder.HasOne(em => em.User)
            .WithMany()
            .HasForeignKey(em => em.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
