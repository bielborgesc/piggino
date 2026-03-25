using Piggino.Api.Domain.Bot.Dtos;

namespace Piggino.Api.Domain.Bot.Interfaces
{
    public interface IBotService
    {
        Task<BotLinkTokenResponseDto> GenerateLinkTokenAsync(Guid userId);
        Task<bool> ConnectAsync(BotConnectDto dto);
        Task<BotContextDto?> GetContextAsync(string chatId);
        Task<bool> CreateTransactionAsync(BotTransactionDto dto);
        Task<BotSummaryDto?> GetSummaryAsync(string chatId);
        Task DisconnectAsync(Guid userId);
        Task<List<TelegramConnectionDto>> GetConnectionsAsync(Guid userId);
        Task DisconnectSpecificAsync(Guid userId, int connectionId);
    }
}
