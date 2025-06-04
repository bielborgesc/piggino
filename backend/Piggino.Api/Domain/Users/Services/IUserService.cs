using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Domain.Users.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserReadDto>> GetAllAsync();
        Task<UserReadDto?> GetByIdAsync(int id);
        Task<UserReadDto> CreateAsync(UserCreateDto dto);
        Task<bool> UpdateAsync(int id, UserUpdateDto user);
        Task<bool> DeleteAsync(int id);
        Task<bool> UpdatePasswordAsync(int id, UserPasswordUpdateDto dto);
    }
}
