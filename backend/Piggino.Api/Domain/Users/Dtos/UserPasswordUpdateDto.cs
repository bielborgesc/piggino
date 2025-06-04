namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserPasswordUpdateDto
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}
