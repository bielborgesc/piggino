using Microsoft.EntityFrameworkCore;
using Piggino.Api.Data;
using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.Categories.Interfaces;

namespace Piggino.Api.Infrastructure.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly PigginoDbContext _context;

        public CategoryRepository(PigginoDbContext context)
        {
            _context = context;
        }

        public async Task<Category?> GetByIdAsync(int id, Guid userId)
        {
            // Procura uma categoria pelo seu ID, mas apenas se ela pertencer ao usuário especificado.
            return await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        }

        public async Task<IEnumerable<Category>> GetAllAsync(Guid userId)
        {
            // Retorna todas as categorias que pertencem ao usuário especificado.
            return await _context.Categories
                .Where(c => c.UserId == userId)
                .ToListAsync();
        }

        public async Task AddAsync(Category category)
        {
            // Adiciona uma nova categoria ao contexto do EF Core.
            await _context.Categories.AddAsync(category);
        }

        public void Update(Category category)
        {
            // Marca uma entidade existente como modificada.
            _context.Categories.Update(category);
        }

        public void Delete(Category category)
        {
            // Marca uma entidade existente para ser removida.
            _context.Categories.Remove(category);
        }

        public async Task<bool> SaveChangesAsync()
        {
            // Persiste todas as alterações pendentes (Add, Update, Delete) na base de dados.
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
