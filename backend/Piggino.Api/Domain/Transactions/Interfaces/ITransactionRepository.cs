
using Piggino.Api.Domain.CardInstallments.Entities;
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
        Task<Transaction?> GetByIdWithInstallmentsAsync(int id, Guid userId);
        Task<Transaction?> GetByIdWithInstallmentsAndSourceAsync(int id, Guid userId);
        Task<CardInstallment?> GetCardInstallmentByIdAsync(int installmentId);
        Task<IEnumerable<Transaction>> GetRecurrenceGroupAsync(Transaction anchor, Guid userId);
        void DeleteCardInstallment(CardInstallment installment);
        Task<IEnumerable<CardInstallment>> GetInstallmentsForInvoiceAsync(int financialSourceId, int year, int month, Guid userId);
        Task<IEnumerable<Transaction>> GetFixedTransactionsAsync(Guid userId);
        Task<IEnumerable<FixedTransactionPayment>> GetFixedPaymentsForMonthAsync(Guid userId, int year, int month);
        Task<IEnumerable<FixedTransactionPayment>> GetAllFixedPaymentsAsync(Guid userId);
        Task<FixedTransactionPayment?> GetFixedPaymentAsync(int transactionId, int year, int month);
        Task AddFixedPaymentAsync(FixedTransactionPayment payment);
        void DeleteFixedPayment(FixedTransactionPayment payment);
        Task<IEnumerable<CardInstallment>> GetUnpaidInstallmentsForMonthAsync(Guid userId, int year, int month);
        Task<IEnumerable<Transaction>> GetActiveInstallmentTransactionsAsync(Guid userId);
        Task<Transaction?> GetFixedTransactionByIdAsync(int id, Guid userId);
    }
}
