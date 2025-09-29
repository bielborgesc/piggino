using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class TransactionCreateDto
    {
        [Required]
        [StringLength(150)]
        public required string Description { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal TotalAmount { get; set; }

        [Required]
        [EnumDataType(typeof(TransactionType))]
        public TransactionType TransactionType { get; set; }

        [Required]
        public DateTime PurchaseDate { get; set; }

        public bool IsInstallment { get; set; } = false;

        public int? InstallmentCount { get; set; }

        public bool IsPaid { get; set; } = false;

        [Required]
        public int CategoryId { get; set; }

        [Required]
        public int FinancialSourceId { get; set; }

        public bool IsFixed { get; set; }

        public int? DayOfMonth { get; set; }
    }
}
