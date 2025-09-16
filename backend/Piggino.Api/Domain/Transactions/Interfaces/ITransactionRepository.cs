
using Piggino.Api.Domain.Transactions.Entities;

namespace Piggino.Api.Domain.Transactions.Interfaces
{
    public interface ITransactionRepository
    {
        Task<Transaction?> GetByIdAsync(int id, Guid userId);
        Task<IEnumerable<Transaction>> GetAllAsync(Guid userId);
        Task AddAsync(Transaction transaction);
        void Update(Transaction transaction);
        void Delete(Transaction transaction);
        Task<bool> SaveChangesAsync();
        Task<Transaction?> GetByIdWithInstallmentsAsync(int id, Guid userId); // ✅ Adicione esta linha
    }
}
