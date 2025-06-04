using Piggino.Api.Domain.Transactions.Entities;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.CardInstallments.Entities
{
    public class CardInstallment
    {
        public int Id { get; set; }

        [Required]
        public int InstallmentNumber { get; set; }

        [Required]
        public decimal Amount { get; set; }

        public bool IsPaid { get; set; }

        public int TransactionId { get; set; }
        public Transaction? Transaction { get; set; }
    }
}
