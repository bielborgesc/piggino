using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Helpers;
using System.Numerics;

namespace Piggino.Api.Domain.Users.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _repository;

        public UserService(IUserRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<UserReadDto>> GetAllAsync()
        {
            IEnumerable<User> users = await _repository.GetAllUsersAsync();

            return users.Select(user => new UserReadDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            });
        }

        public async Task<UserReadDto?> GetByIdAsync(Guid id)
        {
            User? user = await _repository.GetUserByIdAsync(id);
            if (user == null)
                return null;

            return new UserReadDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserReadDto> CreateAsync(UserCreateDto dto)
        {
            PasswordHelper.CreatePasswordHash(dto.Password, out byte[] passwordHash, out byte[] passwordSalt);

            User user = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.AddUserAsync(user);

            return new UserReadDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<bool> UpdateAsync(Guid id, UserUpdateDto dto)
        {
            User? user = await _repository.GetUserByIdAsync(id);
            if (user == null)
                return false;

            user.Name = dto.Name;
            user.Email = dto.Email;

            await _repository.UpdateUserAsync(user);
            return true;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            return await _repository.DeleteUserAsync(id);
        }

        public async Task<bool> UpdatePasswordAsync(Guid id, UserPasswordUpdateDto dto)
        {
            User? user = await _repository.GetUserByIdAsync(id);
            if (user == null)
                return false;

            if (!PasswordHelper.VerifyPasswordHash(dto.CurrentPassword, user.PasswordHash, user.PasswordSalt))
                return false;

            PasswordHelper.CreatePasswordHash(dto.NewPassword, out byte[] newPasswordHash, out byte[] newPasswordSalt);
            user.PasswordHash = newPasswordHash;
            user.PasswordSalt = newPasswordSalt;

            await _repository.UpdateUserAsync(user);
            return true;
        }
    }
}
