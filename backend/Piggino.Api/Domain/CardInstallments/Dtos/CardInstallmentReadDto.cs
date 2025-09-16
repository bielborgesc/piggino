namespace Piggino.Api.Domain.CardInstallments.Dtos
{
    public class CardInstallmentReadDto
    {
        public int Id { get; set; }
        public int InstallmentNumber { get; set; }
        public decimal Amount { get; set; }
        public bool IsPaid { get; set; }
        public int TransactionId { get; set; }
    }
}
