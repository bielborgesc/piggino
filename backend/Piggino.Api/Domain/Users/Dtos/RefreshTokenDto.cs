using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class RefreshTokenDto
    {
        [Required]
        public required string RefreshToken { get; set; }
    }
}
