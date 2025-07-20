using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestPlatform.TestHost;
using Newtonsoft.Json;
using NUnit.Framework;
using Piggino.Api.Data;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Helpers;
using Piggino.Api.Tests.Support;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Piggino.Api.Tests.IntegrationTests.Controllers
{
    [TestFixture]
    public class AuthControllerIntegrationTests
    {
        private CustomWebApplicationFactory<Program> _factory;
        private HttpClient _client;

        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            _factory = new CustomWebApplicationFactory<Program>();
            _client = _factory.CreateClient();
            _client.DefaultRequestHeaders.AcceptLanguage.ParseAdd("pt-BR");
        }

        [OneTimeTearDown]
        public void OneTimeTearDown()
        {
            _client.Dispose();
            _factory.Dispose();
        }

        private async Task CreateTestUser(string email, string password)
        {
            using (IServiceScope scope = _factory.Services.CreateScope())
            {
                IServiceProvider scopedServices = scope.ServiceProvider;
                PigginoDbContext db = scopedServices.GetRequiredService<PigginoDbContext>();

                PasswordHelper.CreatePasswordHash(password, out byte[] hash, out byte[] salt);

                if (!db.Users.Any(u => u.Email == email))
                {
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
        }

        [Test]
        public async Task Login_WithValidCredentials_ReturnsOkAndJwtToken()
        {
            // Arrange
            string testEmail = "validuser@test.com";
            string testPassword = "ValidPassword123!";

            await CreateTestUser(testEmail, testPassword);

            UserLoginDto loginDto = new UserLoginDto { Email = testEmail, Password = testPassword };
            StringContent content = new StringContent(JsonConvert.SerializeObject(loginDto), Encoding.UTF8, "application/json");

            // Act
            HttpResponseMessage response = await _client.PostAsync("/api/Auth/login", content);

            // Assert
            response.EnsureSuccessStatusCode();
            string responseString = await response.Content.ReadAsStringAsync();
            dynamic? jsonResponse = JsonConvert.DeserializeObject(responseString);
            Assert.That(jsonResponse?.token, Is.Not.Null);
        }

        [Test]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            string testEmail = "invaliduser@test.com";
            string testPassword = "WrongPassword123";

            UserLoginDto loginDto = new UserLoginDto { Email = testEmail, Password = testPassword };
            StringContent content = new StringContent(JsonConvert.SerializeObject(loginDto), Encoding.UTF8, "application/json");

            // Act
            HttpResponseMessage response = await _client.PostAsync("/api/Auth/login", content);

            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(System.Net.HttpStatusCode.Unauthorized));

            string responseString = await response.Content.ReadAsStringAsync();

            Assert.That(responseString, Does.Contain("Senha atual incorreta ou usuário não encontrado."));
        }

        [Test]
        public async Task Login_WithEmptyCredentials_ReturnsBadRequest()
        {
            // Arrange
            UserLoginDto loginDto = new UserLoginDto { Email = "", Password = "" };
            StringContent content = new StringContent(JsonConvert.SerializeObject(loginDto), Encoding.UTF8, "application/json");

            // Act
            HttpResponseMessage response = await _client.PostAsync("/api/Auth/login", content);

            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

            string responseString = await response.Content.ReadAsStringAsync();
            ValidationProblemDetails? problemDetails = JsonConvert.DeserializeObject<ValidationProblemDetails>(responseString);

            Assert.That(problemDetails, Is.Not.Null);

            Assert.That(problemDetails.Errors.Keys, Has.Member("Email"));
            Assert.That(problemDetails.Errors.Keys, Has.Member("Password"));

            Assert.That(problemDetails.Errors["Email"].FirstOrDefault(), Is.EqualTo("O email é obrigatório."));
            Assert.That(problemDetails.Errors["Password"].FirstOrDefault(), Is.EqualTo("A senha é obrigatória."));
        }
    }
}
