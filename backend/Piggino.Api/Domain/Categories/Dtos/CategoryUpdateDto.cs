using Piggino.Api.Enum;
using System.ComponentModel.DataAnnotations;

namespace Piggino.Api.Domain.Categories.Dtos
{
    public class CategoryUpdateDto
    {
        [Required(ErrorMessage = "NameRequired")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "NameLength")]
        public required string Name { get; set; }

        [Required(ErrorMessage = "TypeRequired")]
        [EnumDataType(typeof(CategoryType), ErrorMessage = "InvalidCategoryType")]
        public CategoryType Type { get; set; }
    }
}
