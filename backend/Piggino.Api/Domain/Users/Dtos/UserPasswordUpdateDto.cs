using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserPasswordUpdateDto
    {
        [Required(ErrorMessage = "PasswordRequired")]
        public required string CurrentPassword { get; set; }

        [Required(ErrorMessage = "PasswordRequired")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "PasswordLength")]
        public required string NewPassword { get; set; }
    }
}
