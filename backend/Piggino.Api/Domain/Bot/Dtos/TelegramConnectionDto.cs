namespace Piggino.Api.Domain.Bot.Dtos
{
    public class TelegramConnectionDto
    {
        public int Id { get; set; }
        public string ChatId { get; set; } = string.Empty;
        public DateTime ConnectedAt { get; set; }
    }
}
