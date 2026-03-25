using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Helpers;
using Piggino.Api.Infrastructure.Localization;

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
            if (dto.Password != dto.ConfirmPassword)
                throw new InvalidOperationException(MessageProvider.Get("PasswordsDoNotMatch"));

            PasswordHelper.CreatePasswordHash(dto.Password, out byte[] passwordHash, out byte[] passwordSalt);

            User user = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Email = dto.Email.Trim().ToLowerInvariant(),
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
            user.Email = dto.Email.Trim().ToLowerInvariant();

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

        public async Task<(bool Success, string? Error)> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
        {
            if (dto.NewPassword != dto.ConfirmNewPassword)
                return (false, MessageProvider.Get("PasswordsDoNotMatch"));

            User? user = await _repository.GetUserByIdAsync(userId);
            if (user == null)
                return (false, MessageProvider.Get("UserNotFound"));

            if (!PasswordHelper.VerifyPasswordHash(dto.CurrentPassword, user.PasswordHash, user.PasswordSalt))
                return (false, MessageProvider.Get("CurrentPasswordIncorrect"));

            PasswordHelper.CreatePasswordHash(dto.NewPassword, out byte[] newHash, out byte[] newSalt);
            user.PasswordHash = newHash;
            user.PasswordSalt = newSalt;
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;

            await _repository.UpdateUserAsync(user);
            return (true, null);
        }

        public async Task<(bool Success, string? Token, string? Error)> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            User? user = await _repository.GetUserByEmailAsync(dto.Email);
            if (user == null)
                return (false, null, MessageProvider.Get("UserNotFound"));

            string resetToken = Guid.NewGuid().ToString("N");
            user.PasswordResetToken = resetToken;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

            await _repository.UpdateUserAsync(user);
            return (true, resetToken, null);
        }

        public async Task<(bool Success, string? Error)> ResetPasswordAsync(ResetPasswordDto dto)
        {
            if (dto.NewPassword != dto.ConfirmNewPassword)
                return (false, MessageProvider.Get("PasswordsDoNotMatch"));

            User? user = await _repository.GetUserByPasswordResetTokenAsync(dto.Token);
            if (user == null || user.PasswordResetTokenExpiry <= DateTime.UtcNow)
                return (false, MessageProvider.Get("InvalidOrExpiredResetToken"));

            PasswordHelper.CreatePasswordHash(dto.NewPassword, out byte[] newHash, out byte[] newSalt);
            user.PasswordHash = newHash;
            user.PasswordSalt = newSalt;
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;

            await _repository.UpdateUserAsync(user);
            return (true, null);
        }

        public async Task<UserSettingsDto?> GetSettingsAsync(Guid userId)
        {
            User? user = await _repository.GetUserByIdAsync(userId);
            if (user == null)
                return null;

            return new UserSettingsDto
            {
                Is503020Enabled = user.Is503020Enabled,
                IsTitheModuleEnabled = user.IsTitheModuleEnabled,
                TitheCategoryId = user.TitheCategoryId,
                TitheFinancialSourceId = user.TitheFinancialSourceId,
                IsTelegramConnected = user.TelegramChatId != null
            };
        }

        public async Task<UserSettingsDto?> UpdateSettingsAsync(Guid userId, UserSettingsDto dto)
        {
            User? user = await _repository.GetUserByIdAsync(userId);
            if (user == null)
                return null;

            user.Is503020Enabled = dto.Is503020Enabled;
            user.IsTitheModuleEnabled = dto.IsTitheModuleEnabled;
            user.TitheCategoryId = dto.TitheCategoryId;
            user.TitheFinancialSourceId = dto.TitheFinancialSourceId;
            await _repository.UpdateUserAsync(user);

            return new UserSettingsDto
            {
                Is503020Enabled = user.Is503020Enabled,
                IsTitheModuleEnabled = user.IsTitheModuleEnabled,
                TitheCategoryId = user.TitheCategoryId,
                TitheFinancialSourceId = user.TitheFinancialSourceId,
                IsTelegramConnected = user.TelegramChatId != null
            };
        }

        public async Task<UserSettingsDto?> ToggleTitheModuleAsync(Guid userId, bool enabled)
        {
            User? user = await _repository.GetUserByIdAsync(userId);
            if (user == null)
                return null;

            user.IsTitheModuleEnabled = enabled;
            await _repository.UpdateUserAsync(user);

            return new UserSettingsDto
            {
                Is503020Enabled = user.Is503020Enabled,
                IsTitheModuleEnabled = user.IsTitheModuleEnabled,
                TitheCategoryId = user.TitheCategoryId,
                TitheFinancialSourceId = user.TitheFinancialSourceId,
                IsTelegramConnected = user.TelegramChatId != null
            };
        }
    }
}
