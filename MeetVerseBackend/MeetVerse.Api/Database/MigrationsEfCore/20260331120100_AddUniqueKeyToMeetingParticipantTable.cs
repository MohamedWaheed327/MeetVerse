using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetVerse.Api.Databasebase.MigrationsEfCore
{
    /// <inheritdoc />
    public partial class AddUniqueKeyToMeetingParticipantTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MeetingParticipants_UserId",
                table: "MeetingParticipants");

            migrationBuilder.CreateIndex(
                name: "IX_MeetingParticipants_UserId_MeetingId",
                table: "MeetingParticipants",
                columns: new[] { "UserId", "MeetingId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MeetingParticipants_UserId_MeetingId",
                table: "MeetingParticipants");

            migrationBuilder.CreateIndex(
                name: "IX_MeetingParticipants_UserId",
                table: "MeetingParticipants",
                column: "UserId");
        }
    }
}
