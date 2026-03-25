namespace Piggino.Api.Domain.Bot.Dtos
{
    public class BotSummaryDto
    {
        public decimal MonthlyIncome { get; set; }
        public decimal MonthlyExpenses { get; set; }
        public decimal Balance { get; set; }
        public required List<BotTopCategoryDto> TopCategories { get; set; }
    }
}
