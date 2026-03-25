namespace Piggino.Api.Domain.Bot.Dtos
{
    public class BotContextDto
    {
        public required List<BotCategoryDto> Categories { get; set; }
        public required List<BotFinancialSourceDto> FinancialSources { get; set; }
    }
}
