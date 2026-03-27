using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Budgets.Entities;
using Piggino.Api.Domain.Budgets.Interfaces;

namespace Piggino.Api.Infrastructure.Repositories
{
    public class BudgetRepository : IBudgetRepository
    {
        private readonly PigginoDbContext _context;

        public BudgetRepository(PigginoDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Budget>> GetAllAsync(Guid userId)
        {
            return await _context.Budgets
                .Include(b => b.Expenses)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<Budget?> GetByIdAsync(int id, Guid userId)
        {
            return await _context.Budgets
                .Include(b => b.Expenses)
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
        }

        public async Task AddAsync(Budget budget)
        {
            await _context.Budgets.AddAsync(budget);
        }

        public async Task AddExpenseAsync(BudgetExpense expense)
        {
            await _context.BudgetExpenses.AddAsync(expense);
        }

        public void Delete(Budget budget)
        {
            _context.Budgets.Remove(budget);
        }

        public void DeleteExpense(BudgetExpense expense)
        {
            _context.BudgetExpenses.Remove(expense);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
