using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserCreateDto
    {
        [Required(ErrorMessage = "NameRequired")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "NameLength")]
        public required string Name { get; set; }

        [Required(ErrorMessage = "EmailRequired")]
        [EmailAddress(ErrorMessage = "EmailAddress")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "PasswordRequired")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "PasswordLength")] 
        public required string Password { get; set; }
    }
}
