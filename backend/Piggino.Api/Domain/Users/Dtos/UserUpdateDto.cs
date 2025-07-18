﻿using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserUpdateDto
    {
        [Required(ErrorMessage = "NameRequired")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "NameLength")]
        public required string Name { get; set; }

        [Required(ErrorMessage = "EmailRequired")]
        [EmailAddress(ErrorMessage = "EmailAddress")]
        public required string Email { get; set; }

    }
}
