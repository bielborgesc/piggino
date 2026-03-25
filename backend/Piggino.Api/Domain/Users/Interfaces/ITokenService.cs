using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Domain.Users.Interfaces
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
    }
}
