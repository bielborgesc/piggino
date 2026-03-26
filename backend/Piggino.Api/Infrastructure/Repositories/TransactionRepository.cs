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

        public async Task<IEnumerable<Transaction>> GetRecurrenceGroupAsync(Transaction anchor, Guid userId)
        {
            return await _context.Transactions
                .Where(t =>
                    t.UserId == userId &&
                    t.IsRecurring &&
                    t.Description == anchor.Description &&
                    t.TotalAmount == anchor.TotalAmount &&
                    t.FinancialSourceId == anchor.FinancialSourceId &&
                    t.CategoryId == anchor.CategoryId)
                .ToListAsync();
        }

        public void DeleteCardInstallment(CardInstallment installment)
        {
            _context.CardInstallments.Remove(installment);
        }

        public async Task<IEnumerable<CardInstallment>> GetInstallmentsForInvoiceAsync(int financialSourceId, int year, int month, Guid userId)
        {
            return await _context.CardInstallments
                .Include(i => i.Transaction)
                    .ThenInclude(t => t!.Category)
                .Include(i => i.Transaction)
                    .ThenInclude(t => t!.FinancialSource)
                .Where(i =>
                    i.Transaction != null &&
                    i.Transaction.UserId == userId &&
                    i.Transaction.FinancialSourceId == financialSourceId &&
                    i.DueDate.Year == year &&
                    i.DueDate.Month == month)
                .ToListAsync();
        }

        public async Task<IEnumerable<Transaction>> GetFixedTransactionsAsync(Guid userId)
        {
            return await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.FinancialSource)
                .Where(t => t.UserId == userId && t.IsFixed && t.DayOfMonth.HasValue)
                .ToListAsync();
        }

        public async Task<IEnumerable<FixedTransactionPayment>> GetFixedPaymentsForMonthAsync(Guid userId, int year, int month)
        {
            return await _context.FixedTransactionPayments
                .Include(p => p.Transaction)
                .Where(p =>
                    p.Transaction != null &&
                    p.Transaction.UserId == userId &&
                    p.Year == year &&
                    p.Month == month)
                .ToListAsync();
        }

        public async Task<IEnumerable<FixedTransactionPayment>> GetAllFixedPaymentsAsync(Guid userId)
        {
            return await _context.FixedTransactionPayments
                .Include(p => p.Transaction)
                .Where(p => p.Transaction != null && p.Transaction.UserId == userId && p.IsPaid)
                .ToListAsync();
        }

        public async Task<FixedTransactionPayment?> GetFixedPaymentAsync(int transactionId, int year, int month)
        {
            return await _context.FixedTransactionPayments
                .FirstOrDefaultAsync(p =>
                    p.TransactionId == transactionId &&
                    p.Year == year &&
                    p.Month == month);
        }

        public async Task AddFixedPaymentAsync(FixedTransactionPayment payment)
        {
            await _context.FixedTransactionPayments.AddAsync(payment);
        }

        public void DeleteFixedPayment(FixedTransactionPayment payment)
        {
            _context.FixedTransactionPayments.Remove(payment);
        }

        public async Task<IEnumerable<CardInstallment>> GetUnpaidInstallmentsForMonthAsync(Guid userId, int year, int month)
        {
            return await _context.CardInstallments
                .Include(i => i.Transaction)
                .Where(i =>
                    i.Transaction != null &&
                    i.Transaction.UserId == userId &&
                    i.DueDate.Year == year &&
                    i.DueDate.Month == month &&
                    !i.IsPaid)
                .ToListAsync();
        }

        public async Task<IEnumerable<Transaction>> GetActiveInstallmentTransactionsAsync(Guid userId)
        {
            return await _context.Transactions
                .Include(t => t.CardInstallments)
                .Include(t => t.FinancialSource)
                .Where(t =>
                    t.UserId == userId &&
                    t.IsInstallment &&
                    t.CardInstallments != null &&
                    t.CardInstallments.Any(i => !i.IsPaid))
                .ToListAsync();
        }

        public async Task<Transaction?> GetFixedTransactionByIdAsync(int id, Guid userId)
        {
            return await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.FinancialSource)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.IsFixed);
        }
    }
}
