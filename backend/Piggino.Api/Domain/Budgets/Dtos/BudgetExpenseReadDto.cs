namespace Piggino.Api.Domain.Budgets.Dtos
{
    public class BudgetExpenseReadDto
    {
        public int Id { get; set; }
        public required string Description { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public int BudgetId { get; set; }
    }
}
