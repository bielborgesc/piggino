using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.Tithe.Interfaces;
using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Enum;

namespace Piggino.Api.Infrastructure.Repositories
{
    public class TitheRepository : ITitheRepository
    {
        private const string TitheCategoryName = "Dizimo";
        private const string TitheDescriptionPrefix = "Dizimo";

        private readonly PigginoDbContext _context;

        public TitheRepository(PigginoDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<(Category Category, decimal Income)>> GetTitheableCategoriesWithIncomeAsync(
            Guid userId, int year, int month)
        {
            var titheableCategories = await _context.Categories
                .Where(c =>
                    c.UserId == userId &&
                    c.Type == CategoryType.Income &&
                    c.IsTitheable)
                .ToListAsync();

            var results = new List<(Category Category, decimal Income)>();

            foreach (var category in titheableCategories)
            {
                decimal income = await _context.Transactions
                    .Where(t =>
                        t.UserId == userId &&
                        t.CategoryId == category.Id &&
                        t.TransactionType == TransactionType.Income &&
                        t.PurchaseDate.Year == year &&
                        t.PurchaseDate.Month == month)
                    .SumAsync(t => (decimal?)t.TotalAmount) ?? 0m;

                if (income > 0)
                    results.Add((category, income));
            }

            return results.AsReadOnly();
        }

        public async Task<bool> TitheTransactionExistsForCategoryAsync(
            Guid userId, int year, int month, string categoryName)
        {
            string expectedPrefix = BuildTitheDescriptionPrefix(categoryName);

            return await _context.Transactions
                .AnyAsync(t =>
                    t.UserId == userId &&
                    t.TransactionType == TransactionType.Expense &&
                    t.Description != null &&
                    t.Description.StartsWith(expectedPrefix) &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month);
        }

        public async Task<Transaction?> FindTitheTransactionForCategoryAsync(
            Guid userId, int year, int month, string categoryName)
        {
            string expectedPrefix = BuildTitheDescriptionPrefix(categoryName);

            return await _context.Transactions
                .FirstOrDefaultAsync(t =>
                    t.UserId == userId &&
                    t.TransactionType == TransactionType.Expense &&
                    t.Description != null &&
                    t.Description.StartsWith(expectedPrefix) &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month);
        }

        public async Task<decimal> GetTotalIncomeForCategoryAsync(Guid userId, int categoryId, int year, int month)
        {
            return await _context.Transactions
                .Where(t =>
                    t.UserId == userId &&
                    t.CategoryId == categoryId &&
                    t.TransactionType == TransactionType.Income &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month)
                .SumAsync(t => (decimal?)t.TotalAmount) ?? 0m;
        }

        public void DeleteTransactionAsync(Transaction transaction)
        {
            _context.Transactions.Remove(transaction);
        }

        public void UpdateTransactionAmount(Transaction transaction, decimal newAmount)
        {
            transaction.TotalAmount = newAmount;
            _context.Transactions.Update(transaction);
        }

        private static string BuildTitheDescriptionPrefix(string categoryName)
        {
            return $"{TitheDescriptionPrefix} - {categoryName}";
        }

        public async Task<Category?> FindTitheCategoryAsync(Guid userId)
        {
            return await _context.Categories
                .FirstOrDefaultAsync(c =>
                    c.UserId == userId &&
                    c.Type == CategoryType.Expense &&
                    c.Name != null &&
                    c.Name.ToLower() == TitheCategoryName.ToLower());
        }

        public async Task<Category?> FindFirstExpenseCategoryAsync(Guid userId)
        {
            return await _context.Categories
                .Where(c => c.UserId == userId && c.Type == CategoryType.Expense)
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync();
        }

        public async Task<FinancialSource?> FindFirstFinancialSourceAsync(Guid userId)
        {
            return await _context.FinancialSources
                .Where(fs => fs.UserId == userId)
                .OrderBy(fs => fs.Id)
                .FirstOrDefaultAsync();
        }

        public async Task AddTransactionAsync(Transaction transaction)
        {
            await _context.Transactions.AddAsync(transaction);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
