using Piggino.Api.Resources;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserPasswordUpdateDto
    {
        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "PasswordRequired")]
        public required string CurrentPassword { get; set; }

        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "PasswordRequired")]
        [StringLength(100, MinimumLength = 6, ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "PasswordLength")]
        public required string NewPassword { get; set; }
    }
}
