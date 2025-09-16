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
                CardInstallments = new List<CardInstallment>()
            };

            GenerateInstallments(newTransaction);
            await _transactionRepository.AddAsync(newTransaction);
            await _transactionRepository.SaveChangesAsync();
            return MapToReadDto(newTransaction);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Transaction? transaction = await _transactionRepository.GetByIdAsync(id, userId);
            if (transaction == null) return false;

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
            Transaction? transaction = await _transactionRepository.GetByIdWithInstallmentsAsync(id, userId);

            if (transaction == null) return false;

            var category = await _categoryRepository.GetByIdAsync(updateDto.CategoryId, userId);
            var financialSource = await _financialSourceRepository.GetByIdAsync(updateDto.FinancialSourceId, userId);

            if (category == null || financialSource == null)
            {
                throw new InvalidOperationException("Category or Financial Source not found or does not belong to the user.");
            }

            // Atualiza as propriedades principais da transação
            transaction.Description = updateDto.Description;
            transaction.TotalAmount = updateDto.TotalAmount;
            transaction.TransactionType = updateDto.TransactionType;
            transaction.PurchaseDate = updateDto.PurchaseDate;
            transaction.IsPaid = updateDto.IsPaid; // Geralmente se aplica a transações não parceladas
            transaction.CategoryId = updateDto.CategoryId;
            transaction.FinancialSourceId = updateDto.FinancialSourceId;

            // Lógica crucial para recalcular parcelas
            bool needsRecalculation = transaction.IsInstallment != updateDto.IsInstallment ||
                                      transaction.InstallmentCount != updateDto.InstallmentCount ||
                                      (updateDto.IsInstallment && transaction.TotalAmount != updateDto.TotalAmount);

            transaction.IsInstallment = updateDto.IsInstallment;
            transaction.InstallmentCount = updateDto.InstallmentCount;

            if (needsRecalculation)
            {
                // Remove as parcelas antigas. O EF Core rastreia isso para deletar do banco.
                transaction.CardInstallments?.Clear();
                // Gera as novas parcelas com base nos dados atualizados
                GenerateInstallments(transaction);
            }

            _transactionRepository.Update(transaction);
            return await _transactionRepository.SaveChangesAsync();
        }

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
                CategoryName = transaction.Category?.Name, // ✅ Adicionar
                FinancialSourceId = transaction.FinancialSourceId,
                FinancialSourceName = transaction.FinancialSource?.Name, // ✅ Adicionar
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

        public async Task<bool> ToggleInstallmentPaidStatusAsync(int installmentId)
        {
            Guid userId = GetCurrentUserId();
            // A validação de segurança aqui é mais complexa, pois precisamos garantir que a parcela
            // pertence a uma transação do usuário.
            var installment = await _transactionRepository.GetCardInstallmentByIdAsync(installmentId);

            if (installment == null) return false;

            // Carrega a transação pai para verificar o dono
            var transaction = await _transactionRepository.GetByIdAsync(installment.TransactionId, userId);
            if (transaction == null)
            {
                // Se a transação não pertence ao usuário, não autoriza a alteração
                return false;
            }

            installment.IsPaid = !installment.IsPaid;
            // O SaveChangesAsync já está no repositório, mas como estamos modificando
            // uma entidade carregada, podemos chamar o do contexto diretamente aqui por simplicidade.
            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<bool> ToggleTransactionPaidStatusAsync(int transactionId)
        {
            Guid userId = GetCurrentUserId();
            var transaction = await _transactionRepository.GetByIdAsync(transactionId, userId);

            if (transaction == null || transaction.IsInstallment)
            {
                // Não permite alterar transações parceladas por este método ou se não existir
                return false;
            }

            transaction.IsPaid = !transaction.IsPaid;
            _transactionRepository.Update(transaction);
            return await _transactionRepository.SaveChangesAsync();
        }
    }
}
