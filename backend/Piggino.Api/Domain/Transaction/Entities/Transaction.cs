using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Transaction.Entities
{
    public class Transaction
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Description { get; set; }

        [Required]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(20)]
        public TransactionType TransactionType { get; set; }

        [Required]
        public DateTime PurchaseDate { get; set; }

        public bool IsInstallment { get; set; }

        public int? InstallmentCount { get; set; }

        public bool IsPaid { get; set; }

        public int CategoryId { get; set; }
        public Category Category { get; set; }

        public int FinancialSourceId { get; set; }
        public FinancialSource FinancialSource { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public ICollection<CardInstallment> CardInstallments { get; set; }
    }
}
