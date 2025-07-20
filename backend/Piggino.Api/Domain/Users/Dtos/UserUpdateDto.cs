using Piggino.Api.Resources;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserUpdateDto
    {
        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "NameRequired")]
        [StringLength(100, MinimumLength = 2, ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "NameLength")]
        public required string Name { get; set; }

        [Required(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "EmailRequired")]
        [EmailAddress(ErrorMessageResourceType = typeof(Messages), ErrorMessageResourceName = "EmailAddress")]
        public required string Email { get; set; }

    }
}
