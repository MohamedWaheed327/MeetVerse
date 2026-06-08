using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Persistence.Configurations;

public class WhiteboardSessionConfiguration : IEntityTypeConfiguration<WhiteboardSession>
{
    public void Configure(EntityTypeBuilder<WhiteboardSession> builder)
    {
        builder.HasMany(ws => ws.Events)
            .WithOne(e => e.Session)
            .HasForeignKey(e => e.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
