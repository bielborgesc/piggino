namespace Piggino.Api.Domain.Tithe.Dtos
{
    public class TitheStatusDto
    {
        public bool IsEnabled { get; set; }
        public IReadOnlyList<CategoryTithePreviewDto> CategoryPreviews { get; set; } = [];
        public decimal TotalTitheAmount => CategoryPreviews.Sum(p => p.TitheAmount);
        public bool AlreadyGeneratedThisMonth => CategoryPreviews.Count > 0 && CategoryPreviews.All(p => p.AlreadyGenerated);
    }
}
