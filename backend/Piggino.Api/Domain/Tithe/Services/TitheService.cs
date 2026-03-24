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
            var categoriesWithIncome = await _titheRepository.GetTitheableCategoriesWithIncomeAsync(
                userId, now.Year, now.Month);

            var previews = new List<CategoryTithePreviewDto>();

            foreach (var (category, income) in categoriesWithIncome)
            {
                bool alreadyGenerated = await _titheRepository.TitheTransactionExistsForCategoryAsync(
                    userId, now.Year, now.Month, category.Name!);

                previews.Add(new CategoryTithePreviewDto
                {
                    CategoryId = category.Id,
                    CategoryName = category.Name!,
                    IncomeAmount = income,
                    TitheAmount = income * TithePercentage,
                    AlreadyGenerated = alreadyGenerated
                });
            }

            return new TitheStatusDto
            {
                IsEnabled = user.IsTitheModuleEnabled,
                CategoryPreviews = previews.AsReadOnly()
            };
        }

        public async Task<int> GenerateMonthlyTitheAsync(Guid userId, int year, int month)
        {
            var categoriesWithIncome = await _titheRepository.GetTitheableCategoriesWithIncomeAsync(
                userId, year, month);

            if (categoriesWithIncome.Count == 0)
                return 0;

            Category? titheCategory = await _titheRepository.FindTitheCategoryAsync(userId)
                ?? await _titheRepository.FindFirstExpenseCategoryAsync(userId);

            if (titheCategory == null)
                return 0;

            FinancialSource? financialSource = await _titheRepository.FindFirstFinancialSourceAsync(userId);
            if (financialSource == null)
                return 0;

            int createdCount = 0;

            foreach (var (category, income) in categoriesWithIncome)
            {
                bool alreadyExists = await _titheRepository.TitheTransactionExistsForCategoryAsync(
                    userId, year, month, category.Name!);

                if (alreadyExists)
                    continue;

                decimal titheAmount = income * TithePercentage;
                string description = BuildTitheDescription(category.Name!, year, month);

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
                createdCount++;
            }

            if (createdCount > 0)
                await _titheRepository.SaveChangesAsync();

            return createdCount;
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

        private static string BuildTitheDescription(string categoryName, int year, int month)
        {
            return $"{TitheDescriptionPrefix} - {categoryName} - {month}/{year}";
        }
    }
}
