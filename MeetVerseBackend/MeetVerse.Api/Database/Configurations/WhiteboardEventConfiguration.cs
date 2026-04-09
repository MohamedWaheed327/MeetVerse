using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Database.Configurations;

public class WhiteboardEventConfiguration : IEntityTypeConfiguration<WhiteboardEvent>
{
    public void Configure(EntityTypeBuilder<WhiteboardEvent> builder)
    {
        builder.HasOne(we => we.User)
            .WithMany()
            .HasForeignKey(we => we.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
