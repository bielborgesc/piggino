namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class InvoiceReadDto
    {
        public int FinancialSourceId { get; set; }
        public required string FinancialSourceName { get; set; }
        public int ClosingDay { get; set; }
        public int DueDay { get; set; }
        public required string Month { get; set; }
        public DateTime ClosingDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal TotalAmount { get; set; }
        public required IEnumerable<InvoiceItemDto> Items { get; set; }
    }

    public class InvoiceItemDto
    {
        public int TransactionId { get; set; }
        public int InstallmentId { get; set; }
        public required string Description { get; set; }
        public decimal Amount { get; set; }
        public DateTime PurchaseDate { get; set; }
        public int InstallmentNumber { get; set; }
        public int InstallmentCount { get; set; }
        public bool IsPaid { get; set; }
        public string? CategoryName { get; set; }
    }
}
