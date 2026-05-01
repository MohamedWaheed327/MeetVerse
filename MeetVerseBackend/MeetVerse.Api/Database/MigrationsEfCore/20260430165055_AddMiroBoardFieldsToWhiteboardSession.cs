using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetVerse.Api.Database.MigrationsEfCore
{
    /// <inheritdoc />
    public partial class AddMiroBoardFieldsToWhiteboardSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MiroBoardId",
                table: "WhiteboardSessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MiroBoardViewUrl",
                table: "WhiteboardSessions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MiroBoardId",
                table: "WhiteboardSessions");

            migrationBuilder.DropColumn(
                name: "MiroBoardViewUrl",
                table: "WhiteboardSessions");
        }
    }
}
