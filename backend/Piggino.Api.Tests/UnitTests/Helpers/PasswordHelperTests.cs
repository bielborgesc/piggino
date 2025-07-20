using NUnit.Framework;
using Piggino.Api.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Piggino.Api.Tests.UnitTests.Helpers
{
    [TestFixture]
    public class PasswordHelperTests
    {
        [Test]
        public void CreatePasswordHash_ShouldGenerateDifferentHashesForSamePasswordWithDifferentSalts()
        {
            // Arrange
            string password = "MySecurePassword123";

            // Act
            PasswordHelper.CreatePasswordHash(password, out byte[] hash1, out byte[] salt1);
            PasswordHelper.CreatePasswordHash(password, out byte[] hash2, out byte[] salt2);

            // Assert
            Assert.That(salt1.SequenceEqual(salt2), Is.False);
            Assert.That(hash1.SequenceEqual(hash2), Is.False);
        }

        [Test]
        public void VerifyPasswordHash_ShouldReturnTrueForCorrectPassword()
        {
            // Arrange
            string password = "MySecurePassword123";
            PasswordHelper.CreatePasswordHash(password, out byte[] storedHash, out byte[] storedSalt);

            // Act
            bool result = PasswordHelper.VerifyPasswordHash(password, storedHash, storedSalt);

            // Assert
            Assert.That(result, Is.True);

        }

        [Test]
        public void VerifyPasswordHash_ShouldReturnFalseForIncorrectPassword()
        {
            // Arrange
            string correctPassword = "MySecurePassword123";
            string incorrectPassword = "WrongPassword";
            PasswordHelper.CreatePasswordHash(correctPassword, out byte[] storedHash, out byte[] storedSalt);

            // Act
            bool result = PasswordHelper.VerifyPasswordHash(incorrectPassword, storedHash, storedSalt);

            // Assert
            Assert.That(result, Is.False);
        }
    }
}
