using Piggino.Api.Resources;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserLoginDto
    {
        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "EmailRequired")]
        [EmailAddress(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "EmailAddress")]
        public required string Email { get; set; }

        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "PasswordRequired")]
        [StringLength(100, MinimumLength = 6, ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "PasswordLength")]
        public required string Password { get; set; }
    }
}
