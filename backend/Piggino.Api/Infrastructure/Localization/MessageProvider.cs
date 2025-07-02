using System.Globalization;
using System.Resources;

namespace Piggino.Api.Infrastructure.Localization
{
    public static class MessageProvider
    {
        private static readonly ResourceManager _resourceManager =
            new ResourceManager("Resources.Messages", typeof(MessageProvider).Assembly);

        public static string Get(string key)
        {
            var culture = CultureInfo.CurrentUICulture;
            var message = _resourceManager.GetString(key, culture);
            return message ?? $"[[{key}]]"; // fallback visível para debug
        }
    }
}
