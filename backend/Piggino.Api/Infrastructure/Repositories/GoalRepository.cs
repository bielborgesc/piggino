using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Goals.Entities;
using Piggino.Api.Domain.Goals.Interfaces;

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
    }
}
