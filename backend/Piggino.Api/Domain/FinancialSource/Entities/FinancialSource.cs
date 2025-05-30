using Piggino.Api.Domain.Transaction.Entities;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;
using System.Transactions;

namespace Piggino.Api.Domain.FinancialSource.Entities
{
    public class FinancialSource
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [Required]
        [MaxLength(20)]
        public FinancialSourceType Type { get; set; }

        public int? ClosingDay { get; set; }
        public int? DueDay { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public ICollection<Transaction> Transactions { get; set; }
    }
}
