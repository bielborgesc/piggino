using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Helpers;

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
            IEnumerable<User> users = await _repository.GetAllAsync();

            return users.Select(user => new UserReadDto
            {
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            });
        }

        public IUserRepository Get_repository()
        {
            return _repository;
        }

        public async Task<UserReadDto?> GetByIdAsync(int id)
        {
            User? user = await _repository.GetByIdAsync(id);
            if (user == null)
                return null;

            return new UserReadDto
            {
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserReadDto> CreateAsync(UserCreateDto dto)
        {
            User user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = dto.PasswordHash,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(user);

            return new UserReadDto
            {
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<bool> UpdateAsync(int id, UserUpdateDto dto)
        {
            User? user = await _repository.GetByIdAsync(id);
            if (user == null)
                return false;

            user.Name = dto.Name;
            user.Email = dto.Email;

            return await _repository.UpdateAsync(user);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            User? user = await _repository.GetByIdAsync(id);
            if (user == null)
                return false;

            return await _repository.DeleteAsync(user);
        }

        public async Task<bool> UpdatePasswordAsync(int id, UserPasswordUpdateDto dto)
        {
            User? user = await _repository.GetByIdAsync(id);
            if (user == null)
                return false;

            string currentHash = PasswordHelper.Hash(dto.CurrentPassword);
            if (user.PasswordHash != currentHash)
                return false;

            user.PasswordHash = PasswordHelper.Hash(dto.NewPassword);
            return await _repository.UpdateAsync(user);
        }
    }
}
