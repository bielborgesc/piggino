using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Transactions.Interfaces;

namespace Piggino.Api.Infrastructure.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly PigginoDbContext _context;

        public TransactionRepository(PigginoDbContext context)
        {
            _context = context;
        }

        public async Task<Transaction?> GetByIdAsync(int id, Guid userId)
        {
            // Procura uma transação pelo seu ID, mas apenas se ela pertencer ao utilizador especificado.
            return await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        }

        public async Task<IEnumerable<Transaction>> GetAllAsync(Guid userId)
        {
            // Retorna todas as transações que pertencem ao utilizador especificado,
            // ordenadas da mais recente para a mais antiga.
            return await _context.Transactions
                //.Where(t => t.UserId == userId)
                .OrderByDescending(t => t.PurchaseDate)
                .ToListAsync();
        }

        public async Task AddAsync(Transaction transaction)
        {
            // Adiciona uma nova transação ao contexto do EF Core.
            await _context.Transactions.AddAsync(transaction);
        }

        public void Update(Transaction transaction)
        {
            // Marca uma entidade existente como modificada.
            _context.Transactions.Update(transaction);
        }

        public void Delete(Transaction transaction)
        {
            // Marca uma entidade existente para ser removida.
            _context.Transactions.Remove(transaction);
        }

        public async Task<bool> SaveChangesAsync()
        {
            // Persiste todas as alterações pendentes na base de dados.
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
