using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.Transactions.Entities;

namespace Piggino.Api.Domain.Tithe.Interfaces
{
    public interface ITitheRepository
    {
        Task<IReadOnlyList<(Category Category, decimal Income)>> GetTitheableCategoriesWithIncomeAsync(Guid userId, int year, int month);
        Task<bool> TitheTransactionExistsForCategoryAsync(Guid userId, int year, int month, string categoryName);
        Task<Transaction?> FindTitheTransactionForCategoryAsync(Guid userId, int year, int month, string categoryName);
        Task<Category?> FindTitheCategoryAsync(Guid userId);
        Task<Category?> FindFirstExpenseCategoryAsync(Guid userId);
        Task<FinancialSource?> FindFirstFinancialSourceAsync(Guid userId);
        Task<FinancialSource?> FindFinancialSourceByIdAsync(Guid userId, int financialSourceId);
        Task<decimal> GetTotalIncomeForCategoryAsync(Guid userId, int categoryId, int year, int month);
        Task AddTransactionAsync(Transaction transaction);
        void DeleteTransactionAsync(Transaction transaction);
        void UpdateTransactionAmount(Transaction transaction, decimal newAmount);
        Task<bool> SaveChangesAsync();
    }
}
