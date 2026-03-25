namespace Piggino.Api.Domain.Bot.Dtos
{
    public class BotLinkTokenResponseDto
    {
        public required string Token { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
