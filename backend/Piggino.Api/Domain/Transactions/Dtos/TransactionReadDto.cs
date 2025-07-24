using Piggino.Api.Enum;

namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class TransactionReadDto
    {
        public int Id { get; set; }
        public required string Description { get; set; }
        public decimal TotalAmount { get; set; }
        public TransactionType TransactionType { get; set; }
        public DateTime PurchaseDate { get; set; }
        public bool IsInstallment { get; set; }
        public int? InstallmentCount { get; set; }
        public bool IsPaid { get; set; }
        public int CategoryId { get; set; }
        public int FinancialSourceId { get; set; }
        public Guid UserId { get; set; }
    }
}
