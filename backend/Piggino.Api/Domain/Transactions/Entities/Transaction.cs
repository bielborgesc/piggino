using Piggino.Api.Domain.CardInstallments.Entities;
using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.Goals.Entities;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Transactions.Entities
{
    public class Transaction
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string? Description { get; set; }

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

        public bool IsFixed { get; set; } = false;

        public int? DayOfMonth { get; set; }

        public bool IsRecurring { get; set; } = false;

        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        public int FinancialSourceId { get; set; }
        public FinancialSource? FinancialSource { get; set; }

        public Guid UserId { get; set; }
        public User? User { get; set; }

        public int? GoalId { get; set; }
        public Goal? Goal { get; set; }

        public ICollection<CardInstallment>? CardInstallments { get; set; }

        /// <summary>
        /// Populated only for projected installment rows. Not persisted to the database.
        /// Carries the installment number of the specific CardInstallment this row represents.
        /// </summary>
        public int? CurrentInstallmentNumber { get; set; }

        /// <summary>
        /// Populated only for projected credit card rows. Not persisted to the database.
        /// Carries the original purchase date before the PurchaseDate is replaced by the installment DueDate.
        /// </summary>
        public DateTime? OriginalPurchaseDate { get; set; }
    }
}
