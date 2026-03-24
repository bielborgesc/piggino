namespace Piggino.Api.Domain.Tithe.Dtos
{
    public class TitheStatusDto
    {
        public bool IsEnabled { get; set; }
        public decimal? MonthlyIncomeAmount { get; set; }
        public decimal? TitheAmount { get; set; }
        public bool AlreadyGeneratedThisMonth { get; set; }
    }
}
