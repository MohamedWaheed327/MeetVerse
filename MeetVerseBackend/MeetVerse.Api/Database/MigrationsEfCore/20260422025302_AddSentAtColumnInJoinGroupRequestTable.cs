using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetVerse.Api.Database.MigrationsEfCore
{
    /// <inheritdoc />
    public partial class AddSentAtColumnInJoinGroupRequestTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "SentAt",
                table: "JoinGroupRequests",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SentAt",
                table: "JoinGroupRequests");
        }
    }
}
