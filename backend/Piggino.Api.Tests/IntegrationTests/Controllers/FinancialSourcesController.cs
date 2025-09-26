using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using NUnit.Framework;
using Piggino.Api.Data;
using Piggino.Api.Domain.FinancialSources.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Enum;
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
    public class FinancialSourcesControllerIntegrationTests
    {
        private CustomWebApplicationFactory<Program> _factory;
        private HttpClient _client;
        private Guid _testUserId;

        [SetUp]
        public async Task SetUp()
        {
            _factory = new CustomWebApplicationFactory<Program>();
            _client = _factory.CreateClient();
            _testUserId = await SeedTestUserAndGetId();
            string token = GenerateTestJwtToken(_testUserId, "testuser@piggino.com");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        [TearDown]
        public void TearDown()
        {
            _client.Dispose();
            _factory.Dispose();
        }

        [Test]
        public async Task GetFinancialSources_ShouldReturnOkAndListOfSourcesForUser()
        {
            // Act
            HttpResponseMessage response = await _client.GetAsync("/api/FinancialSources");

            // Assert
            response.EnsureSuccessStatusCode();
            string responseString = await response.Content.ReadAsStringAsync();
            List<FinancialSourceReadDto>? sources = JsonConvert.DeserializeObject<List<FinancialSourceReadDto>>(responseString);

            Assert.That(sources, Is.Not.Null);
        }

        [Test]
        public async Task PostFinancialSource_WithValidData_ShouldReturnCreated()
        {
            // Arrange
            FinancialSourceCreateDto createDto = new FinancialSourceCreateDto
            {
                Name = "My Bank Account",
                Type = FinancialSourceType.Account
            };
            StringContent content = new StringContent(JsonConvert.SerializeObject(createDto), Encoding.UTF8, "application/json");

            // Act
            HttpResponseMessage response = await _client.PostAsync("/api/FinancialSources", content);

            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
            string responseString = await response.Content.ReadAsStringAsync();
            FinancialSourceReadDto? createdSource = JsonConvert.DeserializeObject<FinancialSourceReadDto>(responseString);

            Assert.That(createdSource, Is.Not.Null);
            Assert.That(createdSource.Name, Is.EqualTo("My Bank Account"));
            Assert.That(createdSource.UserId, Is.EqualTo(_testUserId));
        }


        private async Task<Guid> SeedTestUserAndGetId()
        {
            using (IServiceScope scope = _factory.Services.CreateScope())
            {
                PigginoDbContext dbContext = scope.ServiceProvider.GetRequiredService<PigginoDbContext>();

                PasswordHelper.CreatePasswordHash("Password123", out byte[] hash, out byte[] salt);
                User newUser = new User
                {
                    Id = Guid.NewGuid(),
                    Name = "Test User",
                    Email = "testuser@piggino.com",
                    PasswordHash = hash,
                    PasswordSalt = salt
                };
                dbContext.Users.Add(newUser);
                await dbContext.SaveChangesAsync();
                return newUser.Id;
            }
        }

        private string GenerateTestJwtToken(Guid userId, string email)
        {
            SymmetricSecurityKey securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(""));
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
    }
}
