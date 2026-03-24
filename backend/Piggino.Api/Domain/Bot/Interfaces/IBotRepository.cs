using Piggino.Api.Domain.Bot.Dtos;
using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Domain.Bot.Interfaces
{
    public interface IBotRepository
    {
        Task<User?> GetUserByTelegramChatIdAsync(string chatId);
        Task<User?> GetUserByLinkTokenAsync(string token);
        Task SaveLinkTokenAsync(Guid userId, string token, DateTime expiry);
        Task ConnectTelegramAsync(Guid userId, string chatId);
        Task<List<BotCategoryDto>> GetUserCategoriesAsync(Guid userId);
        Task<List<BotFinancialSourceDto>> GetUserFinancialSourcesAsync(Guid userId);
        Task<BotSummaryDto> GetMonthlySummaryAsync(Guid userId, int year, int month);
        Task DisconnectTelegramAsync(Guid userId);
    }
}
