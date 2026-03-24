using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Piggino.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTelegramFieldsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TelegramChatId",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelegramLinkToken",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TelegramLinkTokenExpiry",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TelegramChatId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TelegramLinkToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TelegramLinkTokenExpiry",
                table: "Users");
        }
    }
}
