using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Database.Configurations;

public class GroupMessageConfiguration : IEntityTypeConfiguration<GroupMessage>
{
    public void Configure(EntityTypeBuilder<GroupMessage> builder)
    {
        builder.HasOne(gm => gm.Sender)
            .WithMany()
            .HasForeignKey(gm => gm.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
