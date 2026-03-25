using Piggino.Api.Domain.Bot.Dtos;
using Piggino.Api.Domain.Bot.Entities;
using Piggino.Api.Domain.Bot.Interfaces;
using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Transactions.Interfaces;
using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Domain.Bot.Services
{
    public class BotService : IBotService
    {
        private const int LinkTokenExpiryMinutes = 15;

        private readonly IBotRepository _botRepository;
        private readonly ITransactionRepository _transactionRepository;

        public BotService(IBotRepository botRepository, ITransactionRepository transactionRepository)
        {
            _botRepository = botRepository;
            _transactionRepository = transactionRepository;
        }

        public async Task<BotLinkTokenResponseDto> GenerateLinkTokenAsync(Guid userId)
        {
            string token = GenerateSecureToken();
            DateTime expiry = DateTime.UtcNow.AddMinutes(LinkTokenExpiryMinutes);

            await _botRepository.SaveLinkTokenAsync(userId, token, expiry);

            return new BotLinkTokenResponseDto
            {
                Token = token,
                ExpiresAt = expiry
            };
        }

        public async Task<bool> ConnectAsync(BotConnectDto dto)
        {
            User? user = await _botRepository.GetUserByLinkTokenAsync(dto.Token);

            if (user == null)
                return false;

            if (user.TelegramLinkTokenExpiry == null || user.TelegramLinkTokenExpiry < DateTime.UtcNow)
                return false;

            await _botRepository.ConnectTelegramAsync(user.Id, dto.ChatId);

            return true;
        }

        public async Task<BotContextDto?> GetContextAsync(string chatId)
        {
            User? user = await _botRepository.GetUserByTelegramChatIdAsync(chatId);

            if (user == null)
                return null;

            List<BotCategoryDto> categories = await _botRepository.GetUserCategoriesAsync(user.Id);
            List<BotFinancialSourceDto> financialSources = await _botRepository.GetUserFinancialSourcesAsync(user.Id);

            return new BotContextDto
            {
                Categories = categories,
                FinancialSources = financialSources
            };
        }

        public async Task<bool> CreateTransactionAsync(BotTransactionDto dto)
        {
            User? user = await _botRepository.GetUserByTelegramChatIdAsync(dto.ChatId);

            if (user == null)
                return false;

            Transaction transaction = new Transaction
            {
                Description = dto.Description,
                TotalAmount = dto.TotalAmount,
                TransactionType = dto.TransactionType,
                CategoryId = dto.CategoryId,
                FinancialSourceId = dto.FinancialSourceId,
                PurchaseDate = dto.PurchaseDate,
                UserId = user.Id,
                IsPaid = true,
                IsInstallment = false,
                IsFixed = false,
                IsRecurring = false
            };

            await _transactionRepository.AddAsync(transaction);
            await _transactionRepository.SaveChangesAsync();

            return true;
        }

        public async Task<BotSummaryDto?> GetSummaryAsync(string chatId)
        {
            User? user = await _botRepository.GetUserByTelegramChatIdAsync(chatId);

            if (user == null)
                return null;

            DateTime now = DateTime.UtcNow;

            return await _botRepository.GetMonthlySummaryAsync(user.Id, now.Year, now.Month);
        }

        public async Task DisconnectAsync(Guid userId)
        {
            await _botRepository.DisconnectTelegramAsync(userId);
        }

        public async Task<List<TelegramConnectionDto>> GetConnectionsAsync(Guid userId)
        {
            List<UserTelegramConnection> connections = await _botRepository.GetConnectionsAsync(userId);

            return connections.Select(c => new TelegramConnectionDto
            {
                Id = c.Id,
                ChatId = c.ChatId,
                ConnectedAt = c.ConnectedAt
            }).ToList();
        }

        public async Task DisconnectSpecificAsync(Guid userId, int connectionId)
        {
            await _botRepository.DisconnectSpecificAsync(userId, connectionId);
        }

        private static string GenerateSecureToken()
        {
            return Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        }
    }
}
