using Piggino.Api.Domain.FinancialSources.Dtos;

namespace Piggino.Api.Domain.FinancialSources.Interfaces
{
    public interface IFinancialSourceService
    {
        Task<FinancialSourceReadDto?> GetByIdAsync(int id);
        Task<IEnumerable<FinancialSourceReadDto>> GetAllAsync();
        Task<FinancialSourceReadDto> CreateAsync(FinancialSourceCreateDto createDto);
        Task<bool> UpdateAsync(int id, FinancialSourceUpdateDto updateDto);
        Task<bool> DeleteAsync(int id);
    }
}
