using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;
using System.Transactions;

namespace Piggino.Api.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [Required]
        [MaxLength(20)]
        public CategoryType Type { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public ICollection<Transaction> Transactions { get; set; }
    }
}
