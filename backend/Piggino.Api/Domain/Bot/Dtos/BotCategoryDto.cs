namespace Piggino.Api.Domain.Bot.Dtos
{
    public class BotCategoryDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Type { get; set; }
    }
}
