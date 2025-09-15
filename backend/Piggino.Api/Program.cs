using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Piggino.Api.Data;
using Piggino.Api.Domain.Categories.Interfaces;
using Piggino.Api.Domain.Categories.Services;
using Piggino.Api.Domain.FinancialSources.Interfaces;
using Piggino.Api.Domain.FinancialSources.Services;
using Piggino.Api.Domain.Transactions.Interfaces;
using Piggino.Api.Domain.Transactions.Services;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Domain.Users.Services;
using Piggino.Api.Infrastructure.Repositories;
using Piggino.Api.Resources;
using Piggino.Api.Settings;
using System.Globalization;
using System.Text;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure JwtSettings using the options pattern
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

if(!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<PigginoDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
}

builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

builder.Services.AddControllers()
    .AddMvcLocalization(options =>
    {
        options.DataAnnotationLocalizerProvider = (type, factory) =>
            factory.Create(typeof(Messages));
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Por favor, insira 'Bearer' seguido de um espao e o seu token JWT",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// --- CÓDIGO CORRIGIDO ---

// 1. Lê a secção de configuração
var jwtSettingsSection = builder.Configuration.GetSection("JwtSettings");
var jwtKey = jwtSettingsSection["Key"];

// Validação para garantir que a chave não é nula ou vazia
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("A chave JWT (JwtSettings:Key) não está configurada no appsettings.json");
}

// 2. Vincula a configuração a um objeto fortemente tipado
var jwtSettings = jwtSettingsSection.Get<JwtSettings>();

// 3. Adiciona uma validação CRÍTICA para garantir que a chave foi carregada
if (string.IsNullOrEmpty(jwtSettings?.Key))
{
    throw new InvalidOperationException("A chave JWT (JwtSettings:Key) não está configurada ou não pôde ser lida do appsettings.json.");
}

// 4. Configura o IOptions para que o TokenService receba estas mesmas configurações
builder.Services.Configure<JwtSettings>(jwtSettingsSection);

// 5. Configura a autenticação USANDO O MESMO OBJETO que foi validado
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // ... (a sua configuração de TokenValidationParameters continua a mesma)
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
        };

        // --- ADICIONE ESTE BLOCO PARA DEBUGAR ---
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                // Este ponto será atingido sempre que um token falhar na validação.
                Console.WriteLine("--- FALHA NA AUTENTICAÇÃO ---");
                Console.WriteLine("Exceção: " + context.Exception.ToString());
                Console.WriteLine("-----------------------------");
                return Task.CompletedTask;
            }
        };
        // --- FIM DO BLOCO DE DEBUG ---
    });

builder.Services.AddAuthorization();

// Register ITokenService
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFinancialSourceRepository, FinancialSourceRepository>();
builder.Services.AddScoped<IFinancialSourceService, FinancialSourceService>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddHttpContextAccessor();


CultureInfo[] supportedCultures = new[]
{
    new CultureInfo("pt-BR"),
    new CultureInfo("en"),
    new CultureInfo("es")
};

WebApplication app = builder.Build();

RequestLocalizationOptions localizationOptions = new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture("pt-BR"),
    SupportedCultures = supportedCultures,
    SupportedUICultures = supportedCultures
};

app.UseRequestLocalization(localizationOptions);


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseHttpsRedirection();
}

app.UseRouting();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }