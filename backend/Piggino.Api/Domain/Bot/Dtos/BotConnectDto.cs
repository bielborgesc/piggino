using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Bot.Dtos
{
    public class BotConnectDto
    {
        [Required]
        public required string ChatId { get; set; }

        [Required]
        public required string Token { get; set; }
    }
}
