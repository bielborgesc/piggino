using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Domain.Users.Interfaces
{
    public interface IUserRepository
    {
        Task<IEnumerable<User>> GetAllAsync();
        Task<User?> GetByIdAsync(int id);
        Task<User> CreateAsync(User user);
        Task<bool> UpdateAsync(User user);
        Task<bool> DeleteAsync(User user);
    }
}
