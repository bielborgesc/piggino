namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class SimulationReadDto
    {
        public required IEnumerable<SimulationItemDto> Items { get; set; }
        public decimal TotalRemainingAmount { get; set; }
        public decimal TotalMonthlyCommitment { get; set; }
    }

    public class SimulationItemDto
    {
        public int TransactionId { get; set; }
        public required string Description { get; set; }
        public required string FinancialSourceName { get; set; }
        public decimal TotalAmount { get; set; }
        public int InstallmentCount { get; set; }
        public int PaidInstallments { get; set; }
        public int RemainingInstallments { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal MonthlyAmount { get; set; }
        public DateTime NextDueDate { get; set; }
    }
}
