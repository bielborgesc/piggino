using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Piggino.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEndDateToTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "Transactions",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "Transactions");
        }
    }
}
