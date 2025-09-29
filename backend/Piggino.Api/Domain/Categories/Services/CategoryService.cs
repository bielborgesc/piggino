using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Categories.Dtos;
using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.Categories.Interfaces;
using Piggino.Api.Infrastructure.Repositories;
using System.Security.Claims;

namespace Piggino.Api.Domain.Categories.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly PigginoDbContext _context;

        public CategoryService(ICategoryRepository repository, IHttpContextAccessor httpContextAccessor, PigginoDbContext context)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        // Método privado para obter o ID do utilizador logado de forma segura a partir do token
        private Guid GetCurrentUserId()
        {
            string? userId = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                // Esta exceção garante que nenhum dado seja acedido se o utilizador não estiver autenticado
                throw new UnauthorizedAccessException("User is not authenticated.");
            }
            return Guid.Parse(userId);
        }

        public async Task<CategoryReadDto> CreateAsync(CategoryCreateDto createDto)
        {
            Guid userId = GetCurrentUserId();

            Category newCategory = new Category
            {
                Name = createDto.Name,
                Type = createDto.Type,
                UserId = userId // Associa a categoria ao utilizador logado
            };

            await _repository.AddAsync(newCategory);
            await _repository.SaveChangesAsync();

            // Mapeia a entidade para o DTO de leitura para retornar ao controller
            return new CategoryReadDto
            {
                Id = newCategory.Id,
                Name = newCategory.Name,
                Type = newCategory.Type,
                UserId = newCategory.UserId
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Category? category = await _repository.GetByIdAsync(id, userId);

            if (category == null)
            {
                // Retorna false se a categoria não for encontrada ou não pertencer ao utilizador
                return false;
            }

            // ✅ 5. Adicionar a verificação ANTES de apagar
            var isCategoryInUse = await _context.Transactions.AnyAsync(t => t.CategoryId == id && t.UserId == userId);
            if (isCategoryInUse)
            {
                // Lança uma exceção que será capturada pelo Controller
                throw new InvalidOperationException("Esta categoria está em uso por uma ou mais transações e não pode ser apagada.");
            }

            _repository.Delete(category);
            return await _repository.SaveChangesAsync();
        }

        public async Task<IEnumerable<CategoryReadDto>> GetAllAsync()
        {
            Guid userId = GetCurrentUserId();
            IEnumerable<Category> categories = await _repository.GetAllAsync(userId);

            // Usa LINQ para mapear a lista de entidades para uma lista de DTOs
            return categories.Select(c => new CategoryReadDto
            {
                Id = c.Id,
                Name = c.Name,
                Type = c.Type,
                UserId = c.UserId
            });
        }

        public async Task<CategoryReadDto?> GetByIdAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Category? category = await _repository.GetByIdAsync(id, userId);

            if (category == null)
            {
                return null;
            }

            return new CategoryReadDto
            {
                Id = category.Id,
                Name = category.Name,
                Type = category.Type,
                UserId = category.UserId
            };
        }

        public async Task<bool> UpdateAsync(int id, CategoryUpdateDto updateDto)
        {
            Guid userId = GetCurrentUserId();
            Category? category = await _repository.GetByIdAsync(id, userId);

            if (category == null)
            {
                return false;
            }

            // Atualiza as propriedades da entidade com os dados do DTO
            category.Name = updateDto.Name;
            category.Type = updateDto.Type;

            _repository.Update(category);
            return await _repository.SaveChangesAsync();
        }
    }
}
