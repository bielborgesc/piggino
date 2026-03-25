namespace Piggino.Api.Domain.Users.Dtos
{
    public class UserSettingsDto
    {
        public bool Is503020Enabled { get; set; }
        public bool IsTitheModuleEnabled { get; set; }
        public int? TitheCategoryId { get; set; }
        public int? TitheFinancialSourceId { get; set; }
        public bool IsTelegramConnected { get; set; }
    }
}
