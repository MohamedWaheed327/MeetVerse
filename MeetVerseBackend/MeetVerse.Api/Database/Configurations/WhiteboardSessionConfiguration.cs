using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Database.Configurations;

public class WhiteboardSessionConfiguration : IEntityTypeConfiguration<WhiteboardSession>
{
    public void Configure(EntityTypeBuilder<WhiteboardSession> builder)
    {
        builder.HasMany(ws => ws.Events)
            .WithOne(we => we.Session)
            .HasForeignKey(we => we.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
