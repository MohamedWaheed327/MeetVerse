using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.Roles)
            .HasConversion<string>();

        builder.HasMany(u => u.HostedMeetings)
            .WithOne(m => m.Host)
            .HasForeignKey(m => m.HostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(u => u.MeetingParticipants)
            .WithOne(mp => mp.User)
            .HasForeignKey(mp => mp.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(u => u.CreatedGroups)
            .WithOne(g => g.CreatedBy)
            .HasForeignKey(g => g.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(u => u.GroupMessagesSent)
            .WithOne(gm => gm.Sender)
            .HasForeignKey(gm => gm.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(u => u.UserGroups)
            .WithOne(ug => ug.User)
            .HasForeignKey(ug => ug.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
