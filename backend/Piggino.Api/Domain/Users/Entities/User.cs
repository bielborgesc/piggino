using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Users.Entities
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public required string Email { get; set; }

        [Required]
        public required string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<FinancialSource>? FinancialSources { get; set; }
        public ICollection<Category>? Categories { get; set; }
        public ICollection<Transaction>? Transactions { get; set; }
    }
}
