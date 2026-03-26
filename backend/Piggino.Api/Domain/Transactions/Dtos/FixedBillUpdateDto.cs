using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class FixedBillUpdateDto
    {
        [Required]
        public FixedBillScope Scope { get; set; }

        /// <summary>
        /// The anchor month from which the scope applies. Format: yyyy-MM.
        /// </summary>
        [Required]
        public required string AnchorMonth { get; set; }

        [Required]
        [StringLength(150)]
        public required string Description { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal TotalAmount { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        public int FinancialSourceId { get; set; }

        [Required]
        public int DayOfMonth { get; set; }
    }
}
