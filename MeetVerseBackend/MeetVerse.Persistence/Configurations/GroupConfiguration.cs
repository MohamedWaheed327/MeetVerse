using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Persistence.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.HasMany(g => g.Messages)
            .WithOne(gm => gm.Group)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.JoinGroupRequests)
            .WithOne(jgr => jgr.Group)
            .HasForeignKey(jgr => jgr.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
