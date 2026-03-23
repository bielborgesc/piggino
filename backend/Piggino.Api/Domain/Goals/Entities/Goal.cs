using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;

namespace Piggino.Api.Domain.Goals.Entities
{
    public class Goal
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; }
        public DateTime? TargetDate { get; set; }
        public string Color { get; set; } = "#22c55e";
        public GoalType Type { get; set; } = GoalType.Custom;
        public bool IsCompleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
