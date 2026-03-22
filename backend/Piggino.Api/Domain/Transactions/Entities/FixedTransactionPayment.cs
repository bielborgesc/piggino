namespace Piggino.Api.Domain.Transactions.Entities
{
    public class FixedTransactionPayment
    {
        public int Id { get; set; }
        public int TransactionId { get; set; }
        public Transaction? Transaction { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public bool IsPaid { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
