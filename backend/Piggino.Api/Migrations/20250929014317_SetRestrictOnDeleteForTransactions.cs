using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Piggino.Api.Migrations
{
    /// <inheritdoc />
    public partial class SetRestrictOnDeleteForTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_FinancialSources_FinancialSourceId",
                table: "Transactions");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_FinancialSources_FinancialSourceId",
                table: "Transactions",
                column: "FinancialSourceId",
                principalTable: "FinancialSources",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_FinancialSources_FinancialSourceId",
                table: "Transactions");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_FinancialSources_FinancialSourceId",
                table: "Transactions",
                column: "FinancialSourceId",
                principalTable: "FinancialSources",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
