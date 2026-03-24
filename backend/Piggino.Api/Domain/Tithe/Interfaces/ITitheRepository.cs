using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.Transactions.Entities;

namespace Piggino.Api.Domain.Tithe.Interfaces
{
    public interface ITitheRepository
    {
        Task<decimal> GetMonthlyIncomeAsync(Guid userId, int year, int month);
        Task<bool> TitheTransactionExistsForMonthAsync(Guid userId, int year, int month);
        Task<Category?> FindTitheCategoryAsync(Guid userId);
        Task<Category?> FindFirstExpenseCategoryAsync(Guid userId);
        Task<FinancialSource?> FindFirstFinancialSourceAsync(Guid userId);
        Task AddTransactionAsync(Transaction transaction);
        Task<bool> SaveChangesAsync();
    }
}
