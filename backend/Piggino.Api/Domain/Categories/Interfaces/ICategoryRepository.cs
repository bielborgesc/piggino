using Piggino.Api.Domain.Categories.Entities;

namespace Piggino.Api.Domain.Categories.Interfaces
{
    public interface ICategoryRepository
    {
        Task<Category?> GetByIdAsync(int id, Guid userId);
        Task<IEnumerable<Category>> GetAllAsync(Guid userId);
        Task AddAsync(Category category);
        void Update(Category category);
        void Delete(Category category);
        Task<bool> SaveChangesAsync();
    }
}