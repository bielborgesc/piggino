using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.FinancialSources.Entities
{
    public class FinancialSource
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string? Name { get; set; }

        [Required]
        [MaxLength(20)]
        public FinancialSourceType Type { get; set; }

        public int? ClosingDay { get; set; }
        public int? DueDay { get; set; }

        public Guid UserId { get; set; }
        public User? User { get; set; }

        public ICollection<Transaction>? Transactions { get; set; }
    }
}
