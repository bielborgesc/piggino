using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.FinancialSources.Dtos
{
    public class FinancialSourceCreateDto
    {
        [Required(ErrorMessage = "NameRequired")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "NameLength")]
        public required string Name { get; set; }

        [Required(ErrorMessage = "TypeRequired")]
        [EnumDataType(typeof(FinancialSourceType), ErrorMessage = "InvalidFinancialSourceType")]
        public FinancialSourceType Type { get; set; }

        public int? ClosingDay { get; set; }
        public int? DueDay { get; set; }
    }
}
