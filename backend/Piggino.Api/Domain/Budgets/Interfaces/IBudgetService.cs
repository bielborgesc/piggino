using Piggino.Api.Domain.Budgets.Dtos;

namespace Piggino.Api.Domain.Budgets.Interfaces
{
    public interface IBudgetService
    {
        Task<IEnumerable<BudgetReadDto>> GetAllAsync();
        Task<BudgetReadDto?> GetByIdAsync(int id);
        Task<BudgetReadDto> CreateAsync(BudgetCreateDto dto);
        Task<bool> DeleteAsync(int id);
        Task<BudgetExpenseReadDto?> AddExpenseAsync(int budgetId, BudgetExpenseCreateDto dto);
        Task<bool> DeleteExpenseAsync(int budgetId, int expenseId);
    }
}
