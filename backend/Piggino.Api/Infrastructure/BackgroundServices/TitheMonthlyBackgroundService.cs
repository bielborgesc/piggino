using Piggino.Api.Domain.Tithe.Interfaces;

namespace Piggino.Api.Infrastructure.BackgroundServices
{
    public class TitheMonthlyBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TitheMonthlyBackgroundService> _logger;

        public TitheMonthlyBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<TitheMonthlyBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                DateTime nextRun = CalculateNextFirstOfMonth();
                TimeSpan delay = nextRun - DateTime.UtcNow;

                _logger.LogInformation("Tithe background service sleeping until {NextRun}", nextRun);

                await Task.Delay(delay, stoppingToken);

                if (stoppingToken.IsCancellationRequested)
                    break;

                await RunTitheGenerationAsync(nextRun.Year, nextRun.Month);
            }
        }

        private async Task RunTitheGenerationAsync(int year, int month)
        {
            _logger.LogInformation("Running monthly tithe generation for {Year}-{Month}", year, month);

            try
            {
                using IServiceScope scope = _scopeFactory.CreateScope();
                ITitheService titheService = scope.ServiceProvider.GetRequiredService<ITitheService>();
                await titheService.GenerateMonthlyTitheForAllEnabledUsersAsync(year, month);
                _logger.LogInformation("Monthly tithe generation completed for {Year}-{Month}", year, month);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during monthly tithe generation for {Year}-{Month}", year, month);
            }
        }

        private static DateTime CalculateNextFirstOfMonth()
        {
            DateTime now = DateTime.UtcNow;
            DateTime firstOfNextMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc)
                .AddMonths(1);
            return firstOfNextMonth;
        }
    }
}
