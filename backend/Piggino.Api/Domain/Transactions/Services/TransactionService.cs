using Piggino.Api.Domain.CardInstallments.Dtos;
using Piggino.Api.Domain.CardInstallments.Entities;
using Piggino.Api.Domain.Categories.Interfaces;
using Piggino.Api.Domain.FinancialSources.Interfaces;
using Piggino.Api.Domain.Transactions.Dtos;
using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Transactions.Interfaces;
using System.Security.Claims;

namespace Piggino.Api.Domain.Transactions.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IFinancialSourceRepository _financialSourceRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TransactionService(
            ITransactionRepository transactionRepository,
            IFinancialSourceRepository financialSourceRepository,
            ICategoryRepository categoryRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _transactionRepository = transactionRepository;
            _financialSourceRepository = financialSourceRepository;
            _categoryRepository = categoryRepository;
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

        public async Task<TransactionReadDto> CreateAsync(TransactionCreateDto createDto)
        {
            Guid userId = GetCurrentUserId();

            // Validação de segurança: Verifica se a categoria e a fonte financeira pertencem ao utilizador
            var category = await _categoryRepository.GetByIdAsync(createDto.CategoryId, userId);
            var financialSource = await _financialSourceRepository.GetByIdAsync(createDto.FinancialSourceId, userId);

            if (category == null || financialSource == null)
            {
                throw new InvalidOperationException("Category or Financial Source not found or does not belong to the user.");
            }

            Transaction newTransaction = new Transaction
            {
                Description = createDto.Description,
                TotalAmount = createDto.TotalAmount,
                TransactionType = createDto.TransactionType,
                PurchaseDate = createDto.PurchaseDate,
                IsInstallment = createDto.IsInstallment,
                InstallmentCount = createDto.InstallmentCount,
                IsPaid = createDto.IsPaid,
                CategoryId = createDto.CategoryId,
                FinancialSourceId = createDto.FinancialSourceId,
                UserId = userId,
                CardInstallments = new List<CardInstallment>() // Inicializa a coleção de parcelas
            };

            // --- NOVA LÓGICA DE PARCELAMENTO ---
            if (newTransaction.IsInstallment && newTransaction.InstallmentCount.HasValue && newTransaction.InstallmentCount > 0)
            {
                // Calcula o valor de cada parcela (com arredondamento para 2 casas decimais)
                decimal installmentAmount = Math.Round(newTransaction.TotalAmount / newTransaction.InstallmentCount.Value, 2);

                // Cria cada registo de parcela individualmente
                for (int i = 1; i <= newTransaction.InstallmentCount.Value; i++)
                {
                    newTransaction.CardInstallments.Add(new Piggino.Api.Domain.CardInstallments.Entities.CardInstallment
                    {
                        InstallmentNumber = i,
                        Amount = installmentAmount,
                        IsPaid = false // Por padrão, as parcelas não estão pagas
                    });
                }
            }
            // --- FIM DA NOVA LÓGICA ---

            await _transactionRepository.AddAsync(newTransaction);
            await _transactionRepository.SaveChangesAsync();

            return MapToReadDto(newTransaction);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Transaction? transaction = await _transactionRepository.GetByIdAsync(id, userId);

            if (transaction == null)
            {
                return false;
            }

            _transactionRepository.Delete(transaction);
            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<IEnumerable<TransactionReadDto>> GetAllAsync()
        {
            Guid userId = GetCurrentUserId();
            IEnumerable<Transaction> transactions = await _transactionRepository.GetAllAsync(userId);
            return transactions.Select(MapToReadDto);
        }

        public async Task<TransactionReadDto?> GetByIdAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Transaction? transaction = await _transactionRepository.GetByIdAsync(id, userId);

            return transaction == null ? null : MapToReadDto(transaction);
        }

        public async Task<bool> UpdateAsync(int id, TransactionUpdateDto updateDto)
        {
            Guid userId = GetCurrentUserId();
            // Precisamos carregar a transação E suas parcelas existentes
            Transaction? transaction = await _transactionRepository.GetByIdWithInstallmentsAsync(id, userId);

            if (transaction == null)
            {
                return false;
            }

            var category = await _categoryRepository.GetByIdAsync(updateDto.CategoryId, userId);
            var financialSource = await _financialSourceRepository.GetByIdAsync(updateDto.FinancialSourceId, userId);

            if (category == null || financialSource == null)
            {
                throw new InvalidOperationException("Category or Financial Source not found or does not belong to the user.");
            }

            // Atualiza as propriedades principais
            transaction.Description = updateDto.Description;
            transaction.TotalAmount = updateDto.TotalAmount;
            transaction.TransactionType = updateDto.TransactionType;
            transaction.PurchaseDate = updateDto.PurchaseDate;
            transaction.IsPaid = updateDto.IsPaid;
            transaction.CategoryId = updateDto.CategoryId;
            transaction.FinancialSourceId = updateDto.FinancialSourceId;

            // Lógica para lidar com a mudança no parcelamento
            bool installmentChanged = transaction.IsInstallment != updateDto.IsInstallment ||
                                      transaction.InstallmentCount != updateDto.InstallmentCount;

            transaction.IsInstallment = updateDto.IsInstallment;
            transaction.InstallmentCount = updateDto.InstallmentCount;

            // Se o parcelamento mudou ou o valor total mudou, recalcula as parcelas
            if (installmentChanged || transaction.TotalAmount != updateDto.TotalAmount)
            {
                // Limpa as parcelas antigas e gera novas
                transaction.CardInstallments?.Clear();
                GenerateInstallments(transaction);
            }

            _transactionRepository.Update(transaction);
            return await _transactionRepository.SaveChangesAsync();
        }

        // ✅ NOVA FUNÇÃO PRIVADA PARA GERAR PARCELAS
        private void GenerateInstallments(Transaction transaction)
        {
            if (transaction.IsInstallment && transaction.InstallmentCount.HasValue && transaction.InstallmentCount > 0)
            {
                if (transaction.CardInstallments == null)
                {
                    transaction.CardInstallments = new List<CardInstallment>();
                }

                decimal installmentAmount = Math.Round(transaction.TotalAmount / transaction.InstallmentCount.Value, 2);

                for (int i = 1; i <= transaction.InstallmentCount.Value; i++)
                {
                    transaction.CardInstallments.Add(new CardInstallment
                    {
                        InstallmentNumber = i,
                        Amount = installmentAmount,
                        IsPaid = false
                    });
                }
            }
        }

        // Método de mapeamento privado para evitar repetição de código
        private TransactionReadDto MapToReadDto(Transaction transaction)
        {
            return new TransactionReadDto
            {
                Id = transaction.Id,
                Description = transaction.Description,
                TotalAmount = transaction.TotalAmount,
                TransactionType = transaction.TransactionType,
                PurchaseDate = transaction.PurchaseDate,
                IsInstallment = transaction.IsInstallment,
                InstallmentCount = transaction.InstallmentCount,
                IsPaid = transaction.IsPaid,
                CategoryId = transaction.CategoryId,
                FinancialSourceId = transaction.FinancialSourceId,
                UserId = transaction.UserId,
                CardInstallments = transaction.CardInstallments?.Select(ci => new CardInstallmentReadDto
                {
                    Id = ci.Id,
                    InstallmentNumber = ci.InstallmentNumber,
                    Amount = ci.Amount,
                    IsPaid = ci.IsPaid,
                    TransactionId = ci.TransactionId
                }).ToList()
            };
        }
    }
}
