namespace Piggino.Api.Domain.Budgets.Dtos
{
    public class BudgetReadDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal SpentAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public IEnumerable<BudgetExpenseReadDto> Expenses { get; set; } = [];
    }
}
