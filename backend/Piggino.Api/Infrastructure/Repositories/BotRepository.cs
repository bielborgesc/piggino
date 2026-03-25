using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Bot.Dtos;
using Piggino.Api.Domain.Bot.Entities;
using Piggino.Api.Domain.Bot.Interfaces;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;

namespace Piggino.Api.Infrastructure.Repositories
{
    public class BotRepository : IBotRepository
    {
        private readonly PigginoDbContext _context;

        public BotRepository(PigginoDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByTelegramChatIdAsync(string chatId)
        {
            Guid? userId = await _context.TelegramConnections
                .Where(c => c.ChatId == chatId)
                .Select(c => (Guid?)c.UserId)
                .FirstOrDefaultAsync();

            if (userId == null)
                return null;

            return await _context.Users.FindAsync(userId.Value);
        }

        public async Task<User?> GetUserByLinkTokenAsync(string token)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.TelegramLinkToken == token);
        }

        public async Task SaveLinkTokenAsync(Guid userId, string token, DateTime expiry)
        {
            User? user = await _context.Users.FindAsync(userId);

            if (user == null)
                return;

            user.TelegramLinkToken = token;
            user.TelegramLinkTokenExpiry = expiry;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task ConnectTelegramAsync(Guid userId, string chatId)
        {
            User? user = await _context.Users.FindAsync(userId);

            if (user == null)
                return;

            bool alreadyLinked = await _context.TelegramConnections
                .AnyAsync(c => c.ChatId == chatId);

            if (!alreadyLinked)
            {
                UserTelegramConnection connection = new UserTelegramConnection
                {
                    UserId = userId,
                    ChatId = chatId,
                    ConnectedAt = DateTime.UtcNow
                };

                await _context.TelegramConnections.AddAsync(connection);
            }

            user.TelegramLinkToken = null;
            user.TelegramLinkTokenExpiry = null;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<List<BotCategoryDto>> GetUserCategoriesAsync(Guid userId)
        {
            return await _context.Categories
                .Where(c => c.UserId == userId)
                .Select(c => new BotCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name!,
                    Type = c.Type.ToString()
                })
                .ToListAsync();
        }

        public async Task<List<BotFinancialSourceDto>> GetUserFinancialSourcesAsync(Guid userId)
        {
            return await _context.FinancialSources
                .Where(f => f.UserId == userId)
                .Select(f => new BotFinancialSourceDto
                {
                    Id = f.Id,
                    Name = f.Name!
                })
                .ToListAsync();
        }

        public async Task DisconnectTelegramAsync(Guid userId)
        {
            List<UserTelegramConnection> connections = await _context.TelegramConnections
                .Where(c => c.UserId == userId)
                .ToListAsync();

            _context.TelegramConnections.RemoveRange(connections);
            await _context.SaveChangesAsync();
        }

        public async Task<List<UserTelegramConnection>> GetConnectionsAsync(Guid userId)
        {
            return await _context.TelegramConnections
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.ConnectedAt)
                .ToListAsync();
        }

        public async Task DisconnectSpecificAsync(Guid userId, int connectionId)
        {
            UserTelegramConnection? connection = await _context.TelegramConnections
                .FirstOrDefaultAsync(c => c.Id == connectionId && c.UserId == userId);

            if (connection == null)
                return;

            _context.TelegramConnections.Remove(connection);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasAnyConnectionAsync(Guid userId)
        {
            return await _context.TelegramConnections
                .AnyAsync(c => c.UserId == userId);
        }

        public async Task<BotSummaryDto> GetMonthlySummaryAsync(Guid userId, int year, int month)
        {
            DateTime periodStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            DateTime periodEnd = periodStart.AddMonths(1);

            List<(string CategoryName, TransactionType Type, decimal TotalAmount)> transactions =
                await _context.Transactions
                    .Where(t =>
                        t.UserId == userId &&
                        t.PurchaseDate >= periodStart &&
                        t.PurchaseDate < periodEnd &&
                        !t.IsInstallment &&
                        !t.IsFixed)
                    .Join(
                        _context.Categories,
                        t => t.CategoryId,
                        c => c.Id,
                        (t, c) => new
                        {
                            CategoryName = c.Name!,
                            t.TransactionType,
                            t.TotalAmount
                        })
                    .Select(x => ValueTuple.Create(x.CategoryName, x.TransactionType, x.TotalAmount))
                    .ToListAsync();

            decimal monthlyIncome = transactions
                .Where(t => t.Item2 == TransactionType.Income)
                .Sum(t => t.Item3);

            decimal monthlyExpenses = transactions
                .Where(t => t.Item2 == TransactionType.Expense)
                .Sum(t => t.Item3);

            List<BotTopCategoryDto> topCategories = transactions
                .Where(t => t.Item2 == TransactionType.Expense)
                .GroupBy(t => t.Item1)
                .Select(g => new BotTopCategoryDto
                {
                    Name = g.Key,
                    Amount = g.Sum(t => t.Item3)
                })
                .OrderByDescending(c => c.Amount)
                .Take(5)
                .ToList();

            return new BotSummaryDto
            {
                MonthlyIncome = monthlyIncome,
                MonthlyExpenses = monthlyExpenses,
                Balance = monthlyIncome - monthlyExpenses,
                TopCategories = topCategories
            };
        }
    }
}
