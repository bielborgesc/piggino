using Moq;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Domain.Users.Services;
using Piggino.Api.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Piggino.Api.Tests
{
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _userService = new UserService(_mockUserRepository.Object);
        }

        [Fact]
        public async Task CreateAsync_ShouldCreateUserAndHashPassword()
        {
            // Arrange
            var createDto = new UserCreateDto
            {
                Name = "Test User",
                Email = "test@example.com",
                Password = "SecurePassword123"
            };

            _mockUserRepository.Setup(r => r.AddUserAsync(It.IsAny<User>()))
                               .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.CreateAsync(createDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(createDto.Name, result.Name);
            Assert.Equal(createDto.Email, result.Email);
            Assert.NotEqual(Guid.Empty, result.Id);

            _mockUserRepository.Verify(r => r.AddUserAsync(It.Is<User>(u =>
                u.Name == createDto.Name &&
                u.Email == createDto.Email &&
                u.PasswordHash != null && u.PasswordHash.Length > 0 &&
                u.PasswordSalt != null && u.PasswordSalt.Length > 0
            )), Times.Once);
        }

        [Fact]
        public async Task UpdatePasswordAsync_ShouldReturnTrue_WhenPasswordIsCorrectlyUpdated()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var currentPassword = "CurrentSecretPassword";
            var newPassword = "NewSecretPassword";

            byte[] initialHash;
            byte[] initialSalt;
            PasswordHelper.CreatePasswordHash(currentPassword, out initialHash, out initialSalt);

            var existingUser = new User
            {
                Id = userId,
                Name = "Test User",
                Email = "test@example.com",
                PasswordHash = initialHash,
                PasswordSalt = initialSalt
            };

            var updatePasswordDto = new UserPasswordUpdateDto
            {
                CurrentPassword = currentPassword,
                NewPassword = newPassword
            };

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                               .ReturnsAsync(existingUser);
            _mockUserRepository.Setup(r => r.UpdateUserAsync(It.IsAny<User>()))
                               .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.UpdatePasswordAsync(userId, updatePasswordDto);

            // Assert
            Assert.True(result);

            _mockUserRepository.Verify(r => r.UpdateUserAsync(It.IsAny<User>()), Times.Once);
            Assert.False(initialHash.SequenceEqual(existingUser.PasswordHash));
            Assert.True(PasswordHelper.VerifyPasswordHash(newPassword, existingUser.PasswordHash, existingUser.PasswordSalt));
        }

        [Fact]
        public async Task UpdatePasswordAsync_ShouldReturnFalse_WhenUserNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var updatePasswordDto = new UserPasswordUpdateDto
            {
                CurrentPassword = "AnyPassword",
                NewPassword = "NewPassword"
            };

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                               .ReturnsAsync(default(User?));

            // Act
            var result = await _userService.UpdatePasswordAsync(userId, updatePasswordDto);

            // Assert
            Assert.False(result);
            _mockUserRepository.Verify(r => r.UpdateUserAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task UpdatePasswordAsync_ShouldReturnFalse_WhenCurrentPasswordIsIncorrect()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var correctCurrentPassword = "CurrentCorrectPassword";
            var incorrectAttemptPassword = "IncorrectPassword";
            var newPassword = "NewSecretPassword";

            byte[] initialHash;
            byte[] initialSalt;
            PasswordHelper.CreatePasswordHash(correctCurrentPassword, out initialHash, out initialSalt);

            var existingUser = new User
            {
                Id = userId,
                Name = "Test User",
                Email = "test@example.com",
                PasswordHash = initialHash,
                PasswordSalt = initialSalt
            };

            var updatePasswordDto = new UserPasswordUpdateDto
            {
                CurrentPassword = incorrectAttemptPassword,
                NewPassword = newPassword
            };

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                               .ReturnsAsync(existingUser);

            // Act
            var result = await _userService.UpdatePasswordAsync(userId, updatePasswordDto);

            // Assert
            Assert.False(result);
            _mockUserRepository.Verify(r => r.UpdateUserAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnUser_WhenUserExists()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var existingUser = new User
            {
                Id = userId,
                Name = "Existing User",
                Email = "existing@example.com",
                PasswordHash = new byte[1],
                PasswordSalt = new byte[1]
            };

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                               .ReturnsAsync(existingUser);

            // Act
            var result = await _userService.GetByIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(existingUser.Id, result.Id);
            Assert.Equal(existingUser.Name, result.Name);
            Assert.Equal(existingUser.Email, result.Email);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnNull_WhenUserDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                               .ReturnsAsync(default(User?));

            // Act
            var result = await _userService.GetByIdAsync(userId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteAsync_ShouldReturnTrue_WhenUserIsDeleted()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockUserRepository.Setup(r => r.DeleteUserAsync(userId))
                               .ReturnsAsync(true);

            // Act
            var result = await _userService.DeleteAsync(userId);

            // Assert
            Assert.True(result);
            _mockUserRepository.Verify(r => r.DeleteUserAsync(userId), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_ShouldReturnFalse_WhenUserNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockUserRepository.Setup(r => r.DeleteUserAsync(userId))
                               .ReturnsAsync(false);

            // Act
            var result = await _userService.DeleteAsync(userId);

            // Assert
            Assert.False(result);
            _mockUserRepository.Verify(r => r.DeleteUserAsync(userId), Times.Once);
        }
    }
}
