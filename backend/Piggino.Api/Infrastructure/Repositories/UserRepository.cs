using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Interfaces;

namespace Piggino.Api.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly PigginoDbContext _context;

        public UserRepository(PigginoDbContext context)
        {
            _context = context;
        }

        public async Task AddUserAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task<User?> GetUserByIdAsync(Guid id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteUserAsync(Guid id)
        {
            User? user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            _context.Users.Remove(user);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _context.Users.ToListAsync();
        }
    }
}
