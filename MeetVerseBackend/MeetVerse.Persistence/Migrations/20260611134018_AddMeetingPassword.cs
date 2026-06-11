using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetVerse.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingPassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Password",
                table: "Meetings",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Password",
                table: "Meetings");
        }
    }
}
