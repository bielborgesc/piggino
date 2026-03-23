using Piggino.Api.Domain.Goals.Dtos;

namespace Piggino.Api.Domain.Goals.Interfaces
{
    public interface IGoalService
    {
        Task<IEnumerable<GoalReadDto>> GetAllAsync();
        Task<GoalReadDto?> GetByIdAsync(int id);
        Task<GoalReadDto> CreateAsync(GoalCreateDto dto);
        Task<bool> UpdateAsync(int id, GoalUpdateDto dto);
        Task<bool> DeleteAsync(int id);
        Task<GoalReadDto?> AddContributionAsync(int id, AddContributionDto dto);
    }
}
