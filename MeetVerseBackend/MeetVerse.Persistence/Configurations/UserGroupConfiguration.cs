using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Persistence.Configurations;

public class UserGroupConfiguration : IEntityTypeConfiguration<UserGroup>
{
    public void Configure(EntityTypeBuilder<UserGroup> builder)
    {
        builder.HasKey(ug => new { ug.UserId, ug.GroupId });

        builder.Property(ug => ug.Role)
            .HasConversion<string>();
    }
}
