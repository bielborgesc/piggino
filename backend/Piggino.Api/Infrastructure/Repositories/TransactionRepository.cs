using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.CardInstallments.Entities;
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
            return await _context.Transactions
                .Include(t => t.FinancialSource)
                .Include(t => t.Category)
                .Include(t => t.CardInstallments)
                .Where(t => t.UserId == userId)
                .ToListAsync();
        }

        public async Task<Transaction?> GetByIdWithInstallmentsAsync(int id, Guid userId)
        {
            return await _context.Transactions
                .Include(t => t.CardInstallments)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
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

        public async Task<Transaction?> GetByIdWithInstallmentsAndSourceAsync(int id, Guid userId)
        {
            return await _context.Transactions
                .Include(t => t.CardInstallments)
                .Include(t => t.FinancialSource)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        }

        public async Task<CardInstallment?> GetCardInstallmentByIdAsync(int installmentId)
        {
            return await _context.CardInstallments.FindAsync(installmentId);
        }
    }
}
