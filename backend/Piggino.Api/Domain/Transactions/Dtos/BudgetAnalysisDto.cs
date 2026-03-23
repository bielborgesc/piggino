namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class BudgetAnalysisDto
    {
        public required string Month { get; set; }
        public decimal MonthlyIncome { get; set; }
        public decimal NeedsTarget { get; set; }
        public decimal WantsTarget { get; set; }
        public decimal SavingsTarget { get; set; }
        public decimal NeedsActual { get; set; }
        public decimal WantsActual { get; set; }
        public decimal SavingsActual { get; set; }
        public decimal UnclassifiedActual { get; set; }
        public required List<BucketCategoryBreakdown> NeedsCategories { get; set; }
        public required List<BucketCategoryBreakdown> WantsCategories { get; set; }
        public required List<BucketCategoryBreakdown> SavingsCategories { get; set; }
        public required List<string> Insights { get; set; }
    }

    public class BucketCategoryBreakdown
    {
        public required string CategoryName { get; set; }
        public required string CategoryColor { get; set; }
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
    }
}
