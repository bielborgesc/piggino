namespace Piggino.Api.Domain.Transactions.Dtos
{
    public class TipsDto
    {
        public required List<ContextualTip> Tips { get; set; }
    }

    public class ContextualTip
    {
        public required string Title { get; set; }
        public required string Message { get; set; }
        public required string Icon { get; set; }
        public required string Category { get; set; }
        public required string Priority { get; set; }
    }
}
