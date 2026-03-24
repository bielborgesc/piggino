using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.Tithe.Dtos;
using Piggino.Api.Domain.Tithe.Interfaces;
using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Enum;

namespace Piggino.Api.Domain.Tithe.Services
{
    public class TitheService : ITitheService
    {
        private const decimal TithePercentage = 0.10m;
        private const string TitheCategoryName = "Dizimo";
        private const string TitheDescriptionPrefix = "Dizimo";

        private readonly ITitheRepository _titheRepository;
        private readonly IUserRepository _userRepository;

        public TitheService(ITitheRepository titheRepository, IUserRepository userRepository)
        {
            _titheRepository = titheRepository;
            _userRepository = userRepository;
        }

        public async Task<TitheStatusDto> GetStatusAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
                return new TitheStatusDto { IsEnabled = false };

            var now = DateTime.UtcNow;
            decimal monthlyIncome = await _titheRepository.GetMonthlyIncomeAsync(userId, now.Year, now.Month);
            bool alreadyGenerated = await _titheRepository.TitheTransactionExistsForMonthAsync(userId, now.Year, now.Month);

            return new TitheStatusDto
            {
                IsEnabled = user.IsTitheModuleEnabled,
                MonthlyIncomeAmount = monthlyIncome,
                TitheAmount = monthlyIncome * TithePercentage,
                AlreadyGeneratedThisMonth = alreadyGenerated
            };
        }

        public async Task<bool> GenerateMonthlyTitheAsync(Guid userId, int year, int month)
        {
            bool alreadyExists = await _titheRepository.TitheTransactionExistsForMonthAsync(userId, year, month);
            if (alreadyExists)
                return false;

            decimal monthlyIncome = await _titheRepository.GetMonthlyIncomeAsync(userId, year, month);
            if (monthlyIncome <= 0)
                return false;

            Category? titheCategory = await _titheRepository.FindTitheCategoryAsync(userId)
                ?? await _titheRepository.FindFirstExpenseCategoryAsync(userId);

            if (titheCategory == null)
                return false;

            FinancialSource? financialSource = await _titheRepository.FindFirstFinancialSourceAsync(userId);
            if (financialSource == null)
                return false;

            decimal titheAmount = monthlyIncome * TithePercentage;
            string description = BuildTitheDescription(year, month);

            var titheTransaction = new Transaction
            {
                Description = description,
                TotalAmount = titheAmount,
                TransactionType = TransactionType.Expense,
                PurchaseDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc),
                CategoryId = titheCategory.Id,
                FinancialSourceId = financialSource.Id,
                UserId = userId,
                IsPaid = true
            };

            await _titheRepository.AddTransactionAsync(titheTransaction);
            await _titheRepository.SaveChangesAsync();

            return true;
        }

        public async Task GenerateMonthlyTitheForAllEnabledUsersAsync(int year, int month)
        {
            IEnumerable<Domain.Users.Entities.User> allUsers = await _userRepository.GetAllUsersAsync();
            IEnumerable<Domain.Users.Entities.User> enabledUsers = allUsers.Where(u => u.IsTitheModuleEnabled);

            foreach (var user in enabledUsers)
            {
                await GenerateMonthlyTitheAsync(user.Id, year, month);
            }
        }

        private static string BuildTitheDescription(int year, int month)
        {
            var date = new DateTime(year, month, 1);
            string monthName = date.ToString("MMMM/yyyy", new System.Globalization.CultureInfo("pt-BR"));
            return $"{TitheDescriptionPrefix} - {monthName}";
        }
    }
}
