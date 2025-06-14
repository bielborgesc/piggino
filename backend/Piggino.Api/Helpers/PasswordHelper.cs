using System.Security.Cryptography;
using System.Text;

namespace Piggino.Api.Helpers
{
    public static class PasswordHelper
    {
        public static string Hash(string password)
        {
            using SHA256 sHA256 = SHA256.Create();
            byte[] bytes = Encoding.UTF8.GetBytes(password);
            byte[] hash = sHA256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
