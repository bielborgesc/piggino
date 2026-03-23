using Piggino.Api.Domain.Transactions.Dtos;
using Piggino.Api.Enum;


namespace Piggino.Api.Domain.Transactions.Interfaces
{
    public interface ITransactionService
    {
        Task<TransactionReadDto?> GetByIdAsync(int id);
        Task<IEnumerable<TransactionReadDto>> GetAllAsync();
        Task<TransactionReadDto> CreateAsync(TransactionCreateDto createDto);
        Task<bool> UpdateAsync(int id, TransactionUpdateDto updateDto);
        Task<bool> DeleteAsync(int id, RecurrenceScope scope = RecurrenceScope.OnlyThis);
        Task<bool> DeleteInstallmentsByScope(int transactionId, int anchorInstallmentNumber, RecurrenceScope scope);
        Task<bool> UpdateInstallmentsByScope(int transactionId, int anchorInstallmentNumber, TransactionUpdateDto updateDto);
        Task<bool> ToggleInstallmentPaidStatusAsync(int installmentId);
        Task<bool> ToggleTransactionPaidStatusAsync(int transactionId);
        Task<InvoiceReadDto?> GetInvoiceAsync(int financialSourceId, int year, int month);
        Task<bool> PayInvoiceAsync(int financialSourceId, int year, int month);
        Task<MonthlyFixedBillsReadDto> GetMonthlyFixedBillsAsync(int year, int month);
        Task<bool> MarkFixedBillAsPaidAsync(int transactionId, int year, int month);
        Task<bool> UnmarkFixedBillAsPaidAsync(int transactionId, int year, int month);
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(int months);
        Task<bool> SettleInstallmentsAsync(int transactionId);
        Task<SimulationReadDto> GetSimulationAsync();
    }
}
