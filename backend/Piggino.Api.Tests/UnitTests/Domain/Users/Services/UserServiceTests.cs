using Moq;
using NUnit.Framework;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Domain.Users.Services;
using Piggino.Api.Helpers;

namespace Piggino.Api.Tests.UnitTests.Domain.Users.Services
{
    [TestFixture]
    public class UserServiceTests
    {
        private Mock<IUserRepository> _mockUserRepository;
        private UserService _userService;

        [SetUp]
        public void Setup()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _userService = new UserService(_mockUserRepository.Object);
        }

        [Test]
        public async Task CreateAsync_ShouldCreateUserAndHashPassword()
        {
            // Arrange
            UserCreateDto createDto = new UserCreateDto
            {
                Name = "Test User",
                Email = "test@example.com",
                Password = "SecurePassword123"
            };

            _mockUserRepository.Setup(r => r.AddUserAsync(It.IsAny<User>()))
                               .Returns(Task.CompletedTask);

            // Act
            UserReadDto result = await _userService.CreateAsync(createDto);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Name, Is.EqualTo(createDto.Name));
            Assert.That(result.Email, Is.EqualTo(createDto.Email));
            Assert.That(result.Id, Is.Not.EqualTo(Guid.Empty));
        }

        [Test]
        public async Task UpdatePasswordAsync_ShouldReturnFalse_WhenUserNotFound()
        {
            // Arrange
            Guid userId = Guid.NewGuid();
            UserPasswordUpdateDto updatePasswordDto = new UserPasswordUpdateDto
            {
                CurrentPassword = "AnyPassword",
                NewPassword = "NewPassword"
            };

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                               .ReturnsAsync((User?)null);

            // Act
            bool result = await _userService.UpdatePasswordAsync(userId, updatePasswordDto);

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task UpdatePasswordAsync_ShouldReturnFalse_WhenCurrentPasswordIsIncorrect()
        {
            // Arrange
            Guid userId = Guid.NewGuid();
            PasswordHelper.CreatePasswordHash("CorrectPassword", out byte[] hash, out byte[] salt);
            User existingUser = new User { Id = userId, PasswordHash = hash, PasswordSalt = salt, Name = "Test", Email = "test@test.com" };
            UserPasswordUpdateDto updatePasswordDto = new UserPasswordUpdateDto
            {
                CurrentPassword = "IncorrectPassword",
                NewPassword = "NewPassword"
            };

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                               .ReturnsAsync(existingUser);

            // Act
            bool result = await _userService.UpdatePasswordAsync(userId, updatePasswordDto);

            // Assert
            Assert.That(result, Is.False);
            _mockUserRepository.Verify(r => r.UpdateUserAsync(It.IsAny<User>()), Times.Never);
        }

        [Test]
        public async Task DeleteAsync_ShouldReturnFalse_WhenUserDoesNotExist()
        {
            // Arrange
            Guid userId = Guid.NewGuid();
            _mockUserRepository.Setup(r => r.DeleteUserAsync(userId)).ReturnsAsync(false);

            // Act
            bool result = await _userService.DeleteAsync(userId);

            // Assert
            Assert.That(result, Is.False);
        }
    }
}