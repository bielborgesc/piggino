using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using NUnit.Framework;
using Piggino.Api.Data;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Helpers;
using Piggino.Api.Tests.Support;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Piggino.Api.Tests.IntegrationTests.Controllers
{
    [TestFixture]
    public class UserControllerIntegrationTests
    {
        private CustomWebApplicationFactory<Program> _factory;
        private HttpClient _client;

        [SetUp]
        public void SetUp()
        {
            _factory = new CustomWebApplicationFactory<Program>();
            _client = _factory.CreateClient();
        }

        [TearDown]
        public void TearDown()
        {
            _client.Dispose();
            _factory.Dispose();
        }

        private string GenerateTestJwtToken(Guid userId, string email)
        {
            SymmetricSecurityKey securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("PMvk++AZeBwdXWXzkZb44Sobk+anpASZ4Nw8nEp9vh0="));
            SigningCredentials credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            Claim[] claims = new[] {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };

            JwtSecurityToken token = new JwtSecurityToken(
                issuer: "PigginoApi",
                audience: "PigginoUsers",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [Test]
        public async Task GetUser_ShouldReturnUnauthorized_WhenNoTokenIsProvided()
        {
            // Act
            HttpResponseMessage response = await _client.GetAsync($"/api/User/{Guid.NewGuid()}");

            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        }

        [Test]
        public async Task AllEndpoints_ShouldReturnUnauthorized_WhenUsingAValidTokenForAUserThatDoesNotExist()
        {
            // Arrange - Gera um token para um GUID aleatório que não existe no banco
            string token = GenerateTestJwtToken(Guid.NewGuid(), "ghost@user.com");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // Act
            HttpResponseMessage getResponse = await _client.GetAsync($"/api/User/{Guid.NewGuid()}");

            // Assert
            Assert.That(getResponse.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        }

        [Test]
        public async Task Post_ShouldReturnUnauthorized_WhenTokenIsMissing()
        {
            // Arrange
            UserCreateDto createDto = new UserCreateDto { Name = "Test", Email = "test@test.com", Password = "Password123" };
            StringContent content = new StringContent(JsonConvert.SerializeObject(createDto), Encoding.UTF8, "application/json");

            // Act
            HttpResponseMessage response = await _client.PostAsync("/api/User", content);

            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        }
    }
}
