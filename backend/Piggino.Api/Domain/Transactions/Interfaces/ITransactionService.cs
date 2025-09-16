using Piggino.Api.Domain.Transactions.Dtos;

namespace Piggino.Api.Domain.Transactions.Interfaces
{
    public interface ITransactionService
    {
        Task<TransactionReadDto?> GetByIdAsync(int id);
        Task<IEnumerable<TransactionReadDto>> GetAllAsync();
        Task<TransactionReadDto> CreateAsync(TransactionCreateDto createDto);
        Task<bool> UpdateAsync(int id, TransactionUpdateDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<bool> ToggleInstallmentPaidStatusAsync(int installmentId); // ✅ Adicionar
        Task<bool> ToggleTransactionPaidStatusAsync(int transactionId); // ✅ Adicionar esta linha
    }
}
