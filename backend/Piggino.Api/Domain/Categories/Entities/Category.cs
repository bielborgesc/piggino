﻿using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Categories.Entities
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string? Name { get; set; }

        [Required]
        [MaxLength(20)]
        public CategoryType Type { get; set; }

        public Guid UserId { get; set; }
        public User? User { get; set; }

        public ICollection<Transaction>? Transactions { get; set; }
    }
}
