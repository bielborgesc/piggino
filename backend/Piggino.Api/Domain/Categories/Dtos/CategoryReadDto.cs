using Piggino.Api.Enum;

namespace Piggino.Api.Domain.Categories.Dtos
{
    public class CategoryReadDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public CategoryType Type { get; set; }
        public Guid UserId { get; set; }
    }
}
