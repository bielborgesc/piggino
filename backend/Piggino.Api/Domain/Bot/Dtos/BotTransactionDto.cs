using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Bot.Dtos
{
    public class BotTransactionDto
    {
        [Required]
        public required string ChatId { get; set; }

        [Required]
        [StringLength(150)]
        public required string Description { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal TotalAmount { get; set; }

        [Required]
        public TransactionType TransactionType { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        public int FinancialSourceId { get; set; }

        [Required]
        public DateTime PurchaseDate { get; set; }
    }
}
