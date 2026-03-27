using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Budgets.Dtos
{
    public class BudgetExpenseCreateDto
    {
        [Required]
        public string Description { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        public DateTime Date { get; set; }
    }
}
