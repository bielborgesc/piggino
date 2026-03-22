namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class MonthlyFixedBillsReadDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal PendingAmount { get; set; }
        public required IEnumerable<FixedBillReadDto> Items { get; set; }
    }
}
