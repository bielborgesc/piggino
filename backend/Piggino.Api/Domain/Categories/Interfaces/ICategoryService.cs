using Piggino.Api.Domain.Categories.Dtos;

namespace Piggino.Api.Domain.Categories.Interfaces
{
    public interface ICategoryService
    {
        Task<CategoryReadDto?> GetByIdAsync(int id);
        Task<IEnumerable<CategoryReadDto>> GetAllAsync();
        Task<CategoryReadDto> CreateAsync(CategoryCreateDto createDto);
        Task<bool> UpdateAsync(int id, CategoryUpdateDto updateDto);
        Task<bool> DeleteAsync(int id);
    }
}