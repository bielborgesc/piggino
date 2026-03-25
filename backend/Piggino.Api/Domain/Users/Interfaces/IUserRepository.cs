using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Domain.Users.Interfaces
{
    public interface IUserRepository
    {
        Task AddUserAsync(User user);
        Task<User?> GetUserByIdAsync(Guid id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByRefreshTokenAsync(string refreshToken);
        Task<User?> GetUserByPasswordResetTokenAsync(string token);
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task UpdateUserAsync(User user);
        Task<bool> DeleteUserAsync(Guid id);
    }
}
