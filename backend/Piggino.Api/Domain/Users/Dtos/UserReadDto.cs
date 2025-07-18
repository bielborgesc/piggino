namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserReadDto
    {
        public required Guid Id { get; set; }
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required DateTime CreatedAt { get; set; }
    }
}
