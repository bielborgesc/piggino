namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class DashboardSummaryDto
    {
        public required IEnumerable<MonthlySummaryDto> MonthlySummaries { get; set; }
        public required IEnumerable<CategoryExpenseDto> ExpensesByCategory { get; set; }
        public required IEnumerable<TopExpenseDto> TopExpenses { get; set; }
        public decimal CurrentMonthIncome { get; set; }
        public decimal CurrentMonthExpenses { get; set; }
        public decimal CurrentMonthBalance { get; set; }
        public int PendingFixedBills { get; set; }
        public decimal PendingInvoiceAmount { get; set; }
    }

    public class MonthlySummaryDto
    {
        public required string Month { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal Balance { get; set; }
    }

    public class CategoryExpenseDto
    {
        public required string CategoryName { get; set; }
        public decimal Total { get; set; }
        public decimal Percentage { get; set; }
    }

    public class TopExpenseDto
    {
        public required string Description { get; set; }
        public decimal Amount { get; set; }
        public string? CategoryName { get; set; }
    }
}
