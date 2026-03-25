using Piggino.Api.Domain.Goals.Entities;

namespace Piggino.Api.Domain.Goals.Interfaces
{
    public interface IGoalRepository
    {
        Task<Goal?> GetByIdAsync(int id, Guid userId);
        Task<IEnumerable<Goal>> GetAllAsync(Guid userId);
        Task AddAsync(Goal goal);
        void Update(Goal goal);
        void Delete(Goal goal);
        Task<bool> SaveChangesAsync();
    }
}
