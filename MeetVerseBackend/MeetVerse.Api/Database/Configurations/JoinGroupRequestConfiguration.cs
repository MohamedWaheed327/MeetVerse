using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Database.Configurations;

public class JoinGroupRequestConfiguration : IEntityTypeConfiguration<JoinGroupRequest>
{
    public void Configure(EntityTypeBuilder<JoinGroupRequest> builder)
    {
        builder.HasOne(joinGroupRequest => joinGroupRequest.User)
            .WithMany()
            .HasForeignKey(joinGroupRequest => joinGroupRequest.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(joinGroupRequest => joinGroupRequest.Group)
            .WithMany()
            .HasForeignKey(joinGroupRequest => joinGroupRequest.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.UserId, p.GroupId })
           .IsUnique();
    }
}
