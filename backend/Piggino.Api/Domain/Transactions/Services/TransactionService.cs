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
                CardInstallments = new List<CardInstallment>(),
                IsFixed = createDto.IsFixed,
                DayOfMonth = createDto.IsFixed ? createDto.DayOfMonth : null
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
            IEnumerable<Transaction> allTransactions = await _transactionRepository.GetAllAsync(userId);

            var projectedTransactions = new List<Transaction>();

            var fixedTransactions = allTransactions.Where(t => t.IsFixed && t.DayOfMonth.HasValue).ToList();
            var nonFixedTransactions = allTransactions.Where(t => !t.IsFixed).ToList();

            // Adiciona as transações normais e parceladas à lista final
            projectedTransactions.AddRange(nonFixedTransactions);

            // Gera as ocorrências das transações fixas para os próximos 12 meses
            if (fixedTransactions.Any())
            {
                DateTime startDate = DateTime.UtcNow.AddMonths(-2); // Começa 2 meses atrás para pegar transações recentes
                for (int i = 0; i < 14; i++) // Projeta por 14 meses (2 passados, atual, 11 futuros)
                {
                    DateTime currentMonth = startDate.AddMonths(i);
                    foreach (var fixedTx in fixedTransactions)
                    {
                        // Garante que o dia seja válido para o mês (ex: dia 31 em fevereiro)
                        int day = Math.Min(fixedTx.DayOfMonth.Value, DateTime.DaysInMonth(currentMonth.Year, currentMonth.Month));
                        var projectedDate = new DateTime(currentMonth.Year, currentMonth.Month, day, 0, 0, 0, DateTimeKind.Utc);

                        // Só adiciona se a data da projeção for igual ou posterior à data de início da transação original
                        if (projectedDate.Date >= fixedTx.PurchaseDate.Date)
                        {
                            // Cria uma "cópia virtual" da transação para o mês atual
                            projectedTransactions.Add(new Transaction
                            {
                                Id = fixedTx.Id, // Mantém o ID original para referência
                                Description = fixedTx.Description,
                                TotalAmount = fixedTx.TotalAmount,
                                TransactionType = fixedTx.TransactionType,
                                PurchaseDate = projectedDate, // A data projetada é a chave aqui!
                                IsInstallment = false,
                                IsFixed = true, // Sinaliza que é uma ocorrência de uma transação fixa
                                IsPaid = false, // O status de "pago" deve ser por ocorrência
                                CategoryId = fixedTx.CategoryId,
                                Category = fixedTx.Category,
                                FinancialSourceId = fixedTx.FinancialSourceId,
                                FinancialSource = fixedTx.FinancialSource,
                                UserId = fixedTx.UserId,
                                DayOfMonth = fixedTx.DayOfMonth
                            });
                        }
                    }
                }
            }

            return projectedTransactions
                .OrderByDescending(t => t.PurchaseDate)
                .Select(MapToReadDto);
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

            transaction.IsFixed = updateDto.IsFixed;
            transaction.DayOfMonth = updateDto.IsFixed ? updateDto.DayOfMonth : null;

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
                IsFixed = transaction.IsFixed, // ✅ Adicionar
                DayOfMonth = transaction.DayOfMonth, // ✅ Adicionar
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
