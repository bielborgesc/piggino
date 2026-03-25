using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Goals.Dtos
{
    public class GoalUpdateDto
    {
        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        public string? Description { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal TargetAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal CurrentAmount { get; set; }

        public DateTime? TargetDate { get; set; }

        public string Color { get; set; } = "#22c55e";

        public GoalType Type { get; set; } = GoalType.Custom;
    }
}
