using Piggino.Api.Enum;

namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class FixedBillReadDto
    {
        public int TransactionId { get; set; }
        public required string Description { get; set; }
        public decimal TotalAmount { get; set; }
        public string? CategoryName { get; set; }
        public string? FinancialSourceName { get; set; }
        public FinancialSourceType? FinancialSourceType { get; set; }
        public int DayOfMonth { get; set; }
        public bool IsPaid { get; set; }
        public int? PaymentId { get; set; }
    }
}
