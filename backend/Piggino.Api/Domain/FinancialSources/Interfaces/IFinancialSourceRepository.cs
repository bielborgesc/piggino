using Piggino.Api.Domain.FinancialSources.Entities;

namespace Piggino.Api.Domain.FinancialSources.Interfaces
{
    public interface IFinancialSourceRepository
    {
        Task<FinancialSource?> GetByIdAsync(int id, Guid userId);
        Task<IEnumerable<FinancialSource>> GetAllAsync(Guid userId);
        Task AddAsync(FinancialSource financialSource);
        void Update(FinancialSource financialSource);
        void Delete(FinancialSource financialSource);
        Task<bool> SaveChangesAsync();
    }
}
