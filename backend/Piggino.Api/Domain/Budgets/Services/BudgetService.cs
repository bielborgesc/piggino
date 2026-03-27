using Piggino.Api.Domain.Budgets.Dtos;
using Piggino.Api.Domain.Budgets.Entities;
using Piggino.Api.Domain.Budgets.Interfaces;
using System.Security.Claims;

namespace Piggino.Api.Domain.Budgets.Services
{
    public class BudgetService : IBudgetService
    {
        private readonly IBudgetRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public BudgetService(IBudgetRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<IEnumerable<BudgetReadDto>> GetAllAsync()
        {
            Guid userId = GetCurrentUserId();
            IEnumerable<Budget> budgets = await _repository.GetAllAsync(userId);
            return budgets.Select(MapToReadDto);
        }

        public async Task<BudgetReadDto?> GetByIdAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Budget? budget = await _repository.GetByIdAsync(id, userId);

            if (budget == null)
                return null;

            return MapToReadDto(budget);
        }

        public async Task<BudgetReadDto> CreateAsync(BudgetCreateDto dto)
        {
            Guid userId = GetCurrentUserId();

            Budget newBudget = new Budget
            {
                Name = dto.Name,
                Description = dto.Description,
                TotalAmount = dto.TotalAmount,
                UserId = userId,
            };

            await _repository.AddAsync(newBudget);
            await _repository.SaveChangesAsync();

            return MapToReadDto(newBudget);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Budget? budget = await _repository.GetByIdAsync(id, userId);

            if (budget == null)
                return false;

            _repository.Delete(budget);
            return await _repository.SaveChangesAsync();
        }

        public async Task<BudgetExpenseReadDto?> AddExpenseAsync(int budgetId, BudgetExpenseCreateDto dto)
        {
            Guid userId = GetCurrentUserId();
            Budget? budget = await _repository.GetByIdAsync(budgetId, userId);

            if (budget == null)
                return null;

            BudgetExpense expense = new BudgetExpense
            {
                Description = dto.Description,
                Amount = dto.Amount,
                Date = NormalizeToUtc(dto.Date),
                BudgetId = budgetId,
            };

            await _repository.AddExpenseAsync(expense);
            await _repository.SaveChangesAsync();

            return MapExpenseToReadDto(expense);
        }

        public async Task<bool> DeleteExpenseAsync(int budgetId, int expenseId)
        {
            Guid userId = GetCurrentUserId();
            Budget? budget = await _repository.GetByIdAsync(budgetId, userId);

            if (budget == null)
                return false;

            BudgetExpense? expense = budget.Expenses.FirstOrDefault(e => e.Id == expenseId);

            if (expense == null)
                return false;

            _repository.DeleteExpense(expense);
            return await _repository.SaveChangesAsync();
        }

        private static BudgetReadDto MapToReadDto(Budget budget)
        {
            decimal spentAmount = budget.Expenses.Sum(e => e.Amount);
            decimal remainingAmount = budget.TotalAmount - spentAmount;

            return new BudgetReadDto
            {
                Id = budget.Id,
                Name = budget.Name,
                Description = budget.Description,
                TotalAmount = budget.TotalAmount,
                SpentAmount = spentAmount,
                RemainingAmount = remainingAmount,
                CreatedAt = budget.CreatedAt,
                Expenses = budget.Expenses.Select(MapExpenseToReadDto),
            };
        }

        private static BudgetExpenseReadDto MapExpenseToReadDto(BudgetExpense expense)
        {
            return new BudgetExpenseReadDto
            {
                Id = expense.Id,
                Description = expense.Description,
                Amount = expense.Amount,
                Date = expense.Date,
                BudgetId = expense.BudgetId,
            };
        }

        private static DateTime NormalizeToUtc(DateTime date)
        {
            if (date.Kind == DateTimeKind.Utc)
                return date;

            return DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }

        private Guid GetCurrentUserId()
        {
            string? userId = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("User is not authenticated.");

            return Guid.Parse(userId);
        }
    }
}
