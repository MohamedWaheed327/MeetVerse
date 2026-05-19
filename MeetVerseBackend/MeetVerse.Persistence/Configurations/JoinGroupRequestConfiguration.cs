using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Persistence.Configurations;

public class JoinGroupRequestConfiguration : IEntityTypeConfiguration<JoinGroupRequest>
{
    public void Configure(EntityTypeBuilder<JoinGroupRequest> builder)
    {
        builder.HasOne(jgr => jgr.User)
            .WithMany(u => u.JoinGroupRequests)
            .HasForeignKey(jgr => jgr.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(jgr => jgr.Group)
            .WithMany(g => g.JoinGroupRequests)
            .HasForeignKey(jgr => jgr.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
