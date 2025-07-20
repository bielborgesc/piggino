using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Piggino.Api.Data;
using System.Linq;
using System;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Piggino.Api.Tests.Support
{
    public class CustomWebApplicationFactory<TProgram>
       : WebApplicationFactory<TProgram> where TProgram : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                services.AddDbContext<PigginoDbContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryDbForTesting");
                });

                ServiceProvider sp = services.BuildServiceProvider();

                using (IServiceScope scope = sp.CreateScope())
                {
                    IServiceProvider scopedServices = scope.ServiceProvider;
                    PigginoDbContext db = scopedServices.GetRequiredService<PigginoDbContext>();
                    ILogger<CustomWebApplicationFactory<TProgram>> logger = scopedServices.GetRequiredService<ILogger<CustomWebApplicationFactory<TProgram>>>();

                    try
                    {
                        db.Database.EnsureDeleted();
                        db.Database.EnsureCreated();
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Erro ao criar o banco de testes: {Message}", ex.Message);
                    }
                }
            });
        }
    }
}
