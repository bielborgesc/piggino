using Piggino.Api.Enum;

namespace Piggino.Api.Domain.Goals.Dtos
{
    public class GoalReadDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; }
        public DateTime? TargetDate { get; set; }
        public string Color { get; set; } = "#22c55e";
        public GoalType Type { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid UserId { get; set; }
        public decimal ProgressPercentage { get; set; }
        public int? MonthsToGoal { get; set; }
    }
}
