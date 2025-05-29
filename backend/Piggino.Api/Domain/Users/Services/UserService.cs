using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Interfaces;

namespace Piggino.Api.Domain.Users.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _repository;

        public UserService(IUserRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<User> CreateAsync(User user)
        {
            return await _repository.CreateAsync(user);
        }

        public async Task<bool> UpdateAsync(int id, User user)
        {
            var existingUser = await _repository.GetByIdAsync(id);
            if (existingUser is null) return false;

            existingUser.Name = user.Name;
            existingUser.Email = user.Email;
            existingUser.PasswordHash = user.PasswordHash;

            await _repository.UpdateAsync(existingUser);
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var user = await _repository.GetByIdAsync(id);
            if (user is null) return false;

            await _repository.DeleteAsync(user);
            return true;
        }
    }
}
