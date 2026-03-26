using Piggino.Api.Domain.Goals.Dtos;
using Piggino.Api.Domain.Goals.Entities;
using Piggino.Api.Domain.Goals.Interfaces;
using System.Security.Claims;

namespace Piggino.Api.Domain.Goals.Services
{
    public class GoalService : IGoalService
    {
        private const decimal ProgressCap = 100m;
        private const int MonthsInYear = 12;

        private readonly IGoalRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public GoalService(IGoalRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<IEnumerable<GoalReadDto>> GetAllAsync()
        {
            Guid userId = GetCurrentUserId();
            IEnumerable<Goal> goals = await _repository.GetAllAsync(userId);
            return goals.Select(MapToReadDto);
        }

        public async Task<GoalReadDto?> GetByIdAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Goal? goal = await _repository.GetByIdAsync(id, userId);

            if (goal == null)
                return null;

            return MapToReadDto(goal);
        }

        public async Task<GoalReadDto> CreateAsync(GoalCreateDto dto)
        {
            Guid userId = GetCurrentUserId();

            Goal newGoal = new Goal
            {
                Name = dto.Name,
                Description = dto.Description,
                TargetAmount = dto.TargetAmount,
                CurrentAmount = dto.CurrentAmount,
                TargetDate = NormalizeToUtc(dto.TargetDate),
                Color = dto.Color,
                Type = dto.Type,
                UserId = userId
            };

            await _repository.AddAsync(newGoal);
            await _repository.SaveChangesAsync();

            return MapToReadDto(newGoal);
        }

        public async Task<bool> UpdateAsync(int id, GoalUpdateDto dto)
        {
            Guid userId = GetCurrentUserId();
            Goal? goal = await _repository.GetByIdAsync(id, userId);

            if (goal == null)
                return false;

            goal.Name = dto.Name;
            goal.Description = dto.Description;
            goal.TargetAmount = dto.TargetAmount;
            goal.CurrentAmount = dto.CurrentAmount;
            goal.TargetDate = NormalizeToUtc(dto.TargetDate);
            goal.Color = dto.Color;
            goal.Type = dto.Type;

            if (goal.CurrentAmount >= goal.TargetAmount)
                goal.IsCompleted = true;

            _repository.Update(goal);
            return await _repository.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Goal? goal = await _repository.GetByIdAsync(id, userId);

            if (goal == null)
                return false;

            _repository.Delete(goal);
            return await _repository.SaveChangesAsync();
        }

        public async Task<GoalReadDto?> AddContributionAsync(int id, AddContributionDto dto)
        {
            Guid userId = GetCurrentUserId();
            Goal? goal = await _repository.GetByIdAsync(id, userId);

            if (goal == null)
                return null;

            goal.CurrentAmount += dto.Amount;

            if (goal.CurrentAmount >= goal.TargetAmount)
                goal.IsCompleted = true;

            _repository.Update(goal);
            await _repository.SaveChangesAsync();

            return MapToReadDto(goal);
        }

        private static GoalReadDto MapToReadDto(Goal goal)
        {
            decimal progressPercentage = goal.TargetAmount > 0
                ? Math.Min((goal.CurrentAmount / goal.TargetAmount) * 100m, ProgressCap)
                : 0m;

            int? monthsToGoal = CalculateMonthsToGoal(goal);

            return new GoalReadDto
            {
                Id = goal.Id,
                Name = goal.Name,
                Description = goal.Description,
                TargetAmount = goal.TargetAmount,
                CurrentAmount = goal.CurrentAmount,
                TargetDate = goal.TargetDate,
                Color = goal.Color,
                Type = goal.Type,
                IsCompleted = goal.IsCompleted,
                CreatedAt = goal.CreatedAt,
                UserId = goal.UserId,
                ProgressPercentage = Math.Round(progressPercentage, 1),
                MonthsToGoal = monthsToGoal
            };
        }

        private static int? CalculateMonthsToGoal(Goal goal)
        {
            if (goal.TargetDate.HasValue)
            {
                DateTime now = DateTime.UtcNow;
                DateTime target = goal.TargetDate.Value;

                if (target <= now)
                    return 0;

                int months = ((target.Year - now.Year) * MonthsInYear) + target.Month - now.Month;
                return Math.Max(months, 0);
            }

            decimal remaining = goal.TargetAmount - goal.CurrentAmount;
            if (remaining <= 0)
                return 0;

            TimeSpan elapsed = DateTime.UtcNow - goal.CreatedAt;
            double monthsElapsed = elapsed.TotalDays / 30.0;

            if (monthsElapsed < 1 || goal.CurrentAmount <= 0)
                return null;

            decimal monthlySavingsRate = goal.CurrentAmount / (decimal)monthsElapsed;

            if (monthlySavingsRate <= 0)
                return null;

            return (int)Math.Ceiling((double)(remaining / monthlySavingsRate));
        }

        private static DateTime? NormalizeToUtc(DateTime? date)
        {
            if (!date.HasValue)
                return null;

            if (date.Value.Kind == DateTimeKind.Utc)
                return date.Value;

            return DateTime.SpecifyKind(date.Value, DateTimeKind.Utc);
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
