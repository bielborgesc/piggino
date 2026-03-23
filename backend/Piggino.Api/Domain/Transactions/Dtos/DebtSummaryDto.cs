namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class DebtSummaryDto
    {
        public List<DebtItemDto> Debts { get; set; } = new();
        public decimal TotalDebt { get; set; }
        public decimal TotalMonthlyPayment { get; set; }
        public int EstimatedMonthsToFreedom { get; set; }
    }

    public class DebtItemDto
    {
        public int TransactionId { get; set; }
        public required string Description { get; set; }
        public required string FinancialSourceName { get; set; }
        public decimal TotalRemaining { get; set; }
        public decimal MonthlyPayment { get; set; }
        public int TotalInstallments { get; set; }
        public int RemainingInstallments { get; set; }
        public string? NextDueDate { get; set; }
        public int Priority_Avalanche { get; set; }
        public int Priority_Snowball { get; set; }
    }
}
