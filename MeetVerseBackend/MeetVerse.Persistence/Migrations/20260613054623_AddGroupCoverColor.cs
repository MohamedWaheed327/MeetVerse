using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetVerse.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupCoverColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CoverGradient",
                table: "Groups",
                newName: "CoverColor");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CoverColor",
                table: "Groups",
                newName: "CoverGradient");
        }
    }
}
