using Piggino.Api.Domain.Tithe.Dtos;

namespace Piggino.Api.Domain.Tithe.Interfaces
{
    public interface ITitheService
    {
        Task<TitheStatusDto> GetStatusAsync(Guid userId);
        Task<bool> GenerateMonthlyTitheAsync(Guid userId, int year, int month);
        Task GenerateMonthlyTitheForAllEnabledUsersAsync(int year, int month);
    }
}
