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

        public async Task<decimal> GetMonthlyIncomeAsync(Guid userId, int year, int month)
        {
            return await _context.Transactions
                .Where(t =>
                    t.UserId == userId &&
                    t.TransactionType == TransactionType.Income &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month)
                .SumAsync(t => (decimal?)t.TotalAmount) ?? 0m;
        }

        public async Task<bool> TitheTransactionExistsForMonthAsync(Guid userId, int year, int month)
        {
            return await _context.Transactions
                .AnyAsync(t =>
                    t.UserId == userId &&
                    t.TransactionType == TransactionType.Expense &&
                    t.Description != null &&
                    t.Description.StartsWith(TitheDescriptionPrefix) &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month);
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
