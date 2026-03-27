using Piggino.Api.Domain.Budgets.Entities;

namespace Piggino.Api.Domain.Budgets.Interfaces
{
    public interface IBudgetRepository
    {
        Task<IEnumerable<Budget>> GetAllAsync(Guid userId);
        Task<Budget?> GetByIdAsync(int id, Guid userId);
        Task AddAsync(Budget budget);
        Task AddExpenseAsync(BudgetExpense expense);
        void Delete(Budget budget);
        void DeleteExpense(BudgetExpense expense);
        Task<bool> SaveChangesAsync();
    }
}
