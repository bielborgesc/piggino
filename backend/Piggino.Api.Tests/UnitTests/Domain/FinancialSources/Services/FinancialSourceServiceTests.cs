using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;
using Piggino.Api.Domain.FinancialSources.Dtos;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.FinancialSources.Interfaces;
using Piggino.Api.Domain.FinancialSources.Services;
using Piggino.Api.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Piggino.Api.Tests.UnitTests.Domain.FinancialSources.Services
{
    [TestFixture]
    public class FinancialSourceServiceTests
    {
        private Mock<IFinancialSourceRepository> _mockRepo;
        private Mock<IHttpContextAccessor> _mockHttpContextAccessor;
        private FinancialSourceService _service;
        private Guid _testUserId;

        [SetUp]
        public void Setup()
        {
            _mockRepo = new Mock<IFinancialSourceRepository>();
            _mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
            _testUserId = Guid.NewGuid();

            ClaimsPrincipal user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()),
            }, "mock"));

            _mockHttpContextAccessor.Setup(x => x.HttpContext).Returns(new DefaultHttpContext() { User = user });

            _service = new FinancialSourceService(_mockRepo.Object, _mockHttpContextAccessor.Object);
        }

        [Test]
        public async Task GetAllAsync_ShouldReturnDtosForUser()
        {
            // Arrange
            List<FinancialSource> sources = new List<FinancialSource>
            {
                new FinancialSource { Id = 1, Name = "Source 1", UserId = _testUserId, Type = FinancialSourceType.Account },
                new FinancialSource { Id = 2, Name = "Source 2", UserId = _testUserId, Type = FinancialSourceType.Card }
            };
            _mockRepo.Setup(repo => repo.GetAllAsync(_testUserId)).ReturnsAsync(sources);

            // Act
            IEnumerable<FinancialSourceReadDto> result = await _service.GetAllAsync();

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.First().Name, Is.EqualTo("Source 1"));
        }

        [Test]
        public async Task GetByIdAsync_WhenSourceExistsAndBelongsToUser_ShouldReturnDto()
        {
            // Arrange
            FinancialSource source = new FinancialSource { Id = 1, Name = "Test Source", UserId = _testUserId, Type = FinancialSourceType.Cash };
            _mockRepo.Setup(repo => repo.GetByIdAsync(1, _testUserId)).ReturnsAsync(source);

            // Act
            FinancialSourceReadDto? result = await _service.GetByIdAsync(1);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(1));
            Assert.That(result.Name, Is.EqualTo("Test Source"));
        }

        [Test]
        public async Task GetByIdAsync_WhenSourceDoesNotExist_ShouldReturnNull()
        {
            // Arrange
            _mockRepo.Setup(repo => repo.GetByIdAsync(It.IsAny<int>(), _testUserId)).ReturnsAsync((FinancialSource?)null);

            // Act
            FinancialSourceReadDto? result = await _service.GetByIdAsync(99);

            // Assert
            Assert.That(result, Is.Null);
        }
    }
}
