using Piggino.Api.Resources;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserLoginDto
    {
        [Required(ErrorMessage = nameof(Messages.EmailRequired))]
        [EmailAddress(ErrorMessage = nameof(Messages.EmailAddress))]
        public required string Email { get; set; }

        [Required(ErrorMessage = nameof(Messages.PasswordRequired))]
        [StringLength(100, MinimumLength = 6, ErrorMessage = nameof(Messages.PasswordLength))]
        public required string Password { get; set; }
    }
}
