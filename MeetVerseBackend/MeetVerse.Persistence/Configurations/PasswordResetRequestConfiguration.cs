using MeetVerse.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MeetVerse.Persistence.Configurations;

public class PasswordResetRequestConfiguration : IEntityTypeConfiguration<PasswordResetRequest>
{
    public void Configure(EntityTypeBuilder<PasswordResetRequest> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(r => r.CodeHash)
            .HasMaxLength(128)
            .IsRequired();

        builder.HasIndex(r => new { r.Email, r.IsUsed, r.ExpiresAtUtc });
    }
}
