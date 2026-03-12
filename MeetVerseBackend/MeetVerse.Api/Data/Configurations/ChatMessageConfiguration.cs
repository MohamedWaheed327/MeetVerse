using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetVerse.Api.Models;

namespace MeetVerse.Api.Data.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.HasOne(cm => cm.Sender)
            .WithMany()
            .HasForeignKey(cm => cm.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
