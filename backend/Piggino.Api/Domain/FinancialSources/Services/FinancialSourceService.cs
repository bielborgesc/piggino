using Piggino.Api.Domain.FinancialSources.Dtos;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.FinancialSources.Interfaces;
using System.Security.Claims;

namespace Piggino.Api.Domain.FinancialSources.Services
{
    public class FinancialSourceService : IFinancialSourceService
    {
        private readonly IFinancialSourceRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public FinancialSourceService(IFinancialSourceRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid GetCurrentUserId()
        {
            string? userId = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User is not authenticated.");
            }
            return Guid.Parse(userId);
        }

        public async Task<FinancialSourceReadDto> CreateAsync(FinancialSourceCreateDto createDto)
        {
            Guid userId = GetCurrentUserId();

            FinancialSource newFinancialSource = new FinancialSource
            {
                Name = createDto.Name,
                Type = createDto.Type,
                ClosingDay = createDto.ClosingDay,
                DueDay = createDto.DueDay,
                UserId = userId // Associa a fonte ao utilizador logado
            };

            await _repository.AddAsync(newFinancialSource);
            await _repository.SaveChangesAsync();

            // Mapeia a entidade criada para o DTO de leitura para retornar ao controller
            return new FinancialSourceReadDto
            {
                Id = newFinancialSource.Id,
                Name = newFinancialSource.Name,
                Type = newFinancialSource.Type,
                ClosingDay = newFinancialSource.ClosingDay,
                DueDay = newFinancialSource.DueDay,
                UserId = newFinancialSource.UserId
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            FinancialSource? financialSource = await _repository.GetByIdAsync(id, userId);

            if (financialSource == null)
            {
                // Não encontrou a fonte ou o utilizador não tem permissão
                return false;
            }

            _repository.Delete(financialSource);
            return await _repository.SaveChangesAsync();
        }

        public async Task<IEnumerable<FinancialSourceReadDto>> GetAllAsync()
        {
            Guid userId = GetCurrentUserId();
            IEnumerable<FinancialSource> financialSources = await _repository.GetAllAsync(userId);

            // Usa LINQ para mapear a lista de entidades para uma lista de DTOs
            return financialSources.Select(fs => new FinancialSourceReadDto
            {
                Id = fs.Id,
                Name = fs.Name ?? string.Empty,
                Type = fs.Type,
                ClosingDay = fs.ClosingDay,
                DueDay = fs.DueDay,
                UserId = fs.UserId
            });
        }

        public async Task<FinancialSourceReadDto?> GetByIdAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            FinancialSource? financialSource = await _repository.GetByIdAsync(id, userId);

            if (financialSource == null)
            {
                return null;
            }

            return new FinancialSourceReadDto
            {
                Id = financialSource.Id,
                Name = financialSource.Name ?? String.Empty,
                Type = financialSource.Type,
                ClosingDay = financialSource.ClosingDay,
                DueDay = financialSource.DueDay,
                UserId = financialSource.UserId
            };
        }

        public async Task<bool> UpdateAsync(int id, FinancialSourceUpdateDto updateDto)
        {
            Guid userId = GetCurrentUserId();
            FinancialSource? financialSource = await _repository.GetByIdAsync(id, userId);

            if (financialSource == null)
            {
                return false;
            }

            financialSource.Name = updateDto.Name;
            financialSource.Type = updateDto.Type;
            financialSource.ClosingDay = updateDto.ClosingDay;
            financialSource.DueDay = updateDto.DueDay;

            _repository.Update(financialSource);
            return await _repository.SaveChangesAsync();
        }
    }
}
