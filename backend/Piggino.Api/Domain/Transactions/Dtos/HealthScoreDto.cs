namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class HealthScoreDto
    {
        public int Score { get; set; }
        public required string Grade { get; set; }
        public required string GradeLabel { get; set; }
        public required List<HealthScoreComponent> Components { get; set; }
        public required List<string> Strengths { get; set; }
        public required List<string> Warnings { get; set; }
    }

    public class HealthScoreComponent
    {
        public required string Name { get; set; }
        public int Score { get; set; }
        public int MaxScore { get; set; }
        public required string Description { get; set; }
    }
}
