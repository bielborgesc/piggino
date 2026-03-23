using Piggino.Api.Helpers;
using Piggino.Api.Resources;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class ChangePasswordDto
    {
        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "PasswordRequired")]
        public required string CurrentPassword { get; set; }

        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "NewPasswordRequired")]
        [PasswordComplexity(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "PasswordComplexity")]
        public required string NewPassword { get; set; }

        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "ConfirmPasswordRequired")]
        public required string ConfirmNewPassword { get; set; }
    }
}
