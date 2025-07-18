using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestPlatform.TestHost;
using Newtonsoft.Json;
using Piggino.Api.Data;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Piggino.Api.Tests
{
    public class AuthControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory<Program> _factory;

        public AuthControllerIntegrationTests(CustomWebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        private async Task CreateTestUser(string email, string password)
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var scopedServices = scope.ServiceProvider;
                var db = scopedServices.GetRequiredService<PigginoDbContext>();

                PasswordHelper.CreatePasswordHash(password, out byte[] hash, out byte[] salt);

                db.Users.Add(new User
                {
                    Id = Guid.NewGuid(),
                    Name = "Test User",
                    Email = email,
                    PasswordHash = hash,
                    PasswordSalt = salt,
                    CreatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
            }
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkAndJwtToken()
        {
            // Arrange
            string testEmail = "validuser@test.com";
            string testPassword = "ValidPassword123!";

            await CreateTestUser(testEmail, testPassword);

            var loginDto = new UserLoginDto { Email = testEmail, Password = testPassword };
            var content = new StringContent(JsonConvert.SerializeObject(loginDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/Auth/login", content);

            // Assert
            response.EnsureSuccessStatusCode();
            string responseString = await response.Content.ReadAsStringAsync();
            dynamic? jsonResponse = JsonConvert.DeserializeObject(responseString);

            Assert.NotNull(jsonResponse?.token);
            Assert.True(jsonResponse?.token.ToString().Length > 0);
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            string testEmail = "invaliduser@test.com";
            string testPassword = "WrongPassword123";

            var loginDto = new UserLoginDto { Email = testEmail, Password = testPassword };
            var content = new StringContent(JsonConvert.SerializeObject(loginDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/Auth/login", content);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
            var responseString = await response.Content.ReadAsStringAsync();
            Assert.Contains("Email ou senha inválidos.", responseString);
        }

        [Fact]
        public async Task Login_WithEmptyCredentials_ReturnsBadRequest()
        {
            // Arrange
            var loginDto = new UserLoginDto { Email = "", Password = "" };
            var content = new StringContent(JsonConvert.SerializeObject(loginDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/Auth/login", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var responseString = await response.Content.ReadAsStringAsync();
            var problemDetails = JsonConvert.DeserializeObject<ValidationProblemDetails>(responseString);

            Assert.NotNull(problemDetails);
            Assert.Contains("Email", problemDetails.Errors.Keys);
            Assert.Contains("Password", problemDetails.Errors.Keys);

            Assert.Contains("O email é obrigatório.", problemDetails.Errors["Email"].FirstOrDefault());
            Assert.Contains("A senha é obrigatória.", problemDetails.Errors["Password"].FirstOrDefault());
        }
    }
}
