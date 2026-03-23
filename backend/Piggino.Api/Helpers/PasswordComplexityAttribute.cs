using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Piggino.Api.Helpers
{
    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
    public sealed class PasswordComplexityAttribute : ValidationAttribute
    {
        private const int MinimumLength = 8;
        private static readonly Regex UpperCasePattern = new Regex("[A-Z]", RegexOptions.Compiled);
        private static readonly Regex DigitPattern = new Regex("[0-9]", RegexOptions.Compiled);

        public override bool IsValid(object? value)
        {
            if (value is not string password)
                return false;

            return password.Length >= MinimumLength
                && UpperCasePattern.IsMatch(password)
                && DigitPattern.IsMatch(password);
        }
    }
}
