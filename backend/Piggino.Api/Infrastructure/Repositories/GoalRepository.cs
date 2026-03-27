using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Goals.Entities;
using Piggino.Api.Domain.Goals.Interfaces;
using Piggino.Api.Domain.Transactions.Entities;

namespace Piggino.Api.Infrastructure.Repositories
{
    public class GoalRepository : IGoalRepository
    {
        private readonly PigginoDbContext _context;

        public GoalRepository(PigginoDbContext context)
        {
            _context = context;
        }

        public async Task<Goal?> GetByIdAsync(int id, Guid userId)
        {
            return await _context.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
        }

        public async Task<IEnumerable<Goal>> GetAllAsync(Guid userId)
        {
            return await _context.Goals
                .Where(g => g.UserId == userId)
                .OrderBy(g => g.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(Goal goal)
        {
            await _context.Goals.AddAsync(goal);
        }

        public void Update(Goal goal)
        {
            _context.Goals.Update(goal);
        }

        public void Delete(Goal goal)
        {
            _context.Goals.Remove(goal);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<decimal> GetPaidTransactionsSumAsync(int goalId)
        {
            decimal paidNonInstallmentSum = await _context.Transactions
                .Where(t => t.GoalId == goalId && t.IsPaid && !t.IsInstallment)
                .SumAsync(t => (decimal?)t.TotalAmount) ?? 0m;

            decimal paidInstallmentSum = await _context.CardInstallments
                .Where(i => i.Transaction != null && i.Transaction.GoalId == goalId && i.IsPaid)
                .SumAsync(i => (decimal?)i.Amount) ?? 0m;

            return paidNonInstallmentSum + paidInstallmentSum;
        }
    }
}
