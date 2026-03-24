namespace Piggino.Api.Domain.Tithe.Dtos
{
    public class CategoryTithePreviewDto
    {
        public int CategoryId { get; set; }
        public required string CategoryName { get; set; }
        public decimal IncomeAmount { get; set; }
        public decimal TitheAmount { get; set; }
        public bool AlreadyGenerated { get; set; }
    }
}
