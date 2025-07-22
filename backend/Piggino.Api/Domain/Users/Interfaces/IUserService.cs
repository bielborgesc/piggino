using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Domain.Users.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserReadDto>> GetAllAsync();
        Task<UserReadDto?> GetByIdAsync(Guid id);
        Task<UserReadDto> CreateAsync(UserCreateDto dto);
        Task<bool> UpdateAsync(Guid id, UserUpdateDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> UpdatePasswordAsync(Guid id, UserPasswordUpdateDto dto);
    }
}
