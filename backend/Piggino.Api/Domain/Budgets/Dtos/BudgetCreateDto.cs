using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Budgets.Dtos
{
    public class BudgetCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal TotalAmount { get; set; }
    }
}
