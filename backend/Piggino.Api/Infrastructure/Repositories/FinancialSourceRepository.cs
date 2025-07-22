using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.FinancialSources.Interfaces;

namespace Piggino.Api.Infrastructure.Repositories
{
    public class FinancialSourceRepository : IFinancialSourceRepository
    {
        private readonly PigginoDbContext _context;

        public FinancialSourceRepository(PigginoDbContext context)
        {
            _context = context;
        }

        public async Task<FinancialSource?> GetByIdAsync(int id, Guid userId)
        {
            return await _context.FinancialSources
                .FirstOrDefaultAsync(fs => fs.Id == id && fs.UserId == userId);
        }

        public async Task<IEnumerable<FinancialSource>> GetAllAsync(Guid userId)
        {
            return await _context.FinancialSources
                .Where(fs => fs.UserId == userId)
                .ToListAsync();
        }

        public async Task AddAsync(FinancialSource financialSource)
        {
            await _context.FinancialSources.AddAsync(financialSource);
        }

        public void Update(FinancialSource financialSource)
        {
            _context.FinancialSources.Update(financialSource);
        }

        public void Delete(FinancialSource financialSource)
        {
            _context.FinancialSources.Remove(financialSource);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
