using Piggino.Api.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Piggino.Api.Tests
{
    public class PasswordHelperTests
    {
        [Fact]
        public void CreatePasswordHash_ShouldGenerateDifferentHashesForSamePasswordWithDifferentSalts()
        {
            // Arrange
            string password = "MySecurePassword123";

            // Act
            PasswordHelper.CreatePasswordHash(password, out byte[] hash1, out byte[] salt1);
            PasswordHelper.CreatePasswordHash(password, out byte[] hash2, out byte[] salt2);

            // Assert
            Assert.False(salt1.SequenceEqual(salt2));
            Assert.False(hash1.SequenceEqual(hash2));
        }

        [Fact]
        public void VerifyPasswordHash_ShouldReturnTrueForCorrectPassword()
        {
            // Arrange
            string password = "MySecurePassword123";
            byte[] storedHash;
            byte[] storedSalt;
            PasswordHelper.CreatePasswordHash(password, out storedHash, out storedSalt);

            // Act
            bool result = PasswordHelper.VerifyPasswordHash(password, storedHash, storedSalt);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void VerifyPasswordHash_ShouldReturnFalseForIncorrectPassword()
        {
            // Arrange
            string correctPassword = "MySecurePassword123";
            string incorrectPassword = "WrongPassword";
            byte[] storedHash;
            byte[] storedSalt;
            PasswordHelper.CreatePasswordHash(correctPassword, out storedHash, out storedSalt);

            // Act
            bool result = PasswordHelper.VerifyPasswordHash(incorrectPassword, storedHash, storedSalt);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void VerifyPasswordHash_ShouldReturnFalseForTamperedHash()
        {
            // Arrange
            string password = "MySecurePassword123";
            byte[] storedHash;
            byte[] storedSalt;
            PasswordHelper.CreatePasswordHash(password, out storedHash, out storedSalt);

            // Act
            storedHash[0] = (byte)(storedHash[0] + 1);
            bool result = PasswordHelper.VerifyPasswordHash(password, storedHash, storedSalt);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void VerifyPasswordHash_ShouldReturnFalseForIncorrectSalt()
        {
            // Arrange
            string password = "MySecurePassword123";
            byte[] storedHash;
            byte[] storedSalt;
            PasswordHelper.CreatePasswordHash(password, out storedHash, out storedSalt);

            byte[] incorrectSalt = new byte[storedSalt.Length];
            Array.Fill(incorrectSalt, (byte)0);

            // Act
            bool result = PasswordHelper.VerifyPasswordHash(password, storedHash, incorrectSalt);

            // Assert
            Assert.False(result);
        }
    }
}
