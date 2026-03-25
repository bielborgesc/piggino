namespace Piggino.Api.Domain.Bot.Entities
{
    public class UserTelegramConnection
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public required string ChatId { get; set; }
        public DateTime ConnectedAt { get; set; }
    }
}
