using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Goals.Dtos
{
    public class AddContributionDto
    {
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
    }
}
