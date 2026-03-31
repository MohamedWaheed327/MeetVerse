using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetVerse.Api.Database.MigrationsEfCore
{
    /// <inheritdoc />
    public partial class DropStatusColumnFromRecordingTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Recordings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Recordings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
