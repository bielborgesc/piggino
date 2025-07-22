using Piggino.Api.Enum;

namespace Piggino.Api.Domain.FinancialSources.Dtos
{
    public class FinancialSourceReadDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public FinancialSourceType Type { get; set; }
        public int? ClosingDay { get; set; }
        public int? DueDay { get; set; }
        public Guid UserId { get; set; }
    }
}
