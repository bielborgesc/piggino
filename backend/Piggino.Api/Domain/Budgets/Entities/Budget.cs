using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Domain.Budgets.Entities
{
    public class Budget
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public ICollection<BudgetExpense> Expenses { get; set; } = new List<BudgetExpense>();
    }
}
