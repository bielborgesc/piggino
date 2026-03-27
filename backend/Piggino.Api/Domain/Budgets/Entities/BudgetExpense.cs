namespace Piggino.Api.Domain.Budgets.Entities
{
    public class BudgetExpense
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public int BudgetId { get; set; }
        public Budget Budget { get; set; } = null!;
    }
}
