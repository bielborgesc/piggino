using System.Globalization;
using System.Reflection;
using System.Resources;

namespace Piggino.Api.Infrastructure.Localization
{
    public static class MessageProvider
    {
        private static readonly ResourceManager _resourceManager = new ResourceManager("Piggino.Api.Resources.Messages", Assembly.GetExecutingAssembly());

        public static string Get(string key)
        {
            return _resourceManager.GetString(key, CultureInfo.CurrentCulture) ?? $"!{key}!";
        }
    }
}
