using Piggino.Api.Domain.CardInstallments.Dtos;
using Piggino.Api.Domain.CardInstallments.Entities;
using Piggino.Api.Domain.Categories.Interfaces;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.FinancialSources.Interfaces;
using Piggino.Api.Domain.Transactions.Dtos;
using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Transactions.Interfaces;
using Piggino.Api.Enum;
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

            GenerateInstallments(newTransaction, financialSource);
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
            // Importante: Incluir os CardInstallments na busca do banco
            IEnumerable<Transaction> allTransactions = await _transactionRepository.GetAllAsync(userId);

            var projectedTransactions = new List<Transaction>();

            // 1. Separar por tipos de comportamento
            var fixedTransactions = allTransactions.Where(t => t.IsFixed && t.DayOfMonth.HasValue).ToList();

            // Transações que NÃO são fixas e NÃO são de cartão (ex: dinheiro, pix, débito)
            // Essas devem aparecer na data da compra mesmo.
            var normalTransactions = allTransactions.Where(t => !t.IsFixed &&
                (t.FinancialSource == null || t.FinancialSource.Type != FinancialSourceType.Card)).ToList();

            // Transações de Cartão de Crédito (que possuem parcelas/vencimentos)
            var creditCardTransactions = allTransactions.Where(t => !t.IsFixed &&
                t.FinancialSource != null && t.FinancialSource.Type == FinancialSourceType.Card).ToList();

            // Adiciona transações normais (dinheiro/débito)
            projectedTransactions.AddRange(normalTransactions);

            // 2. PROJEÇÃO DE CARTÃO DE CRÉDITO
            foreach (var cardTx in creditCardTransactions)
            {
                if (cardTx.CardInstallments != null && cardTx.CardInstallments.Any())
                {
                    foreach (var installment in cardTx.CardInstallments)
                    {
                        projectedTransactions.Add(new Transaction
                        {
                            Id = cardTx.Id,
                            Description = cardTx.InstallmentCount > 1
                                ? $"{cardTx.Description} ({installment.InstallmentNumber}/{cardTx.InstallmentCount})"
                                : cardTx.Description,
                            TotalAmount = installment.Amount,
                            TransactionType = cardTx.TransactionType,
                            // AQUI: A PurchaseDate (exibição) vira o Vencimento, mas a Original continua a mesma
                            PurchaseDate = installment.DueDate,
                            OriginalPurchaseDate = cardTx.OriginalPurchaseDate,
                            IsInstallment = true,
                            IsFixed = false,
                            IsPaid = installment.IsPaid,
                            CategoryId = cardTx.CategoryId,
                            Category = cardTx.Category,
                            FinancialSourceId = cardTx.FinancialSourceId,
                            FinancialSource = cardTx.FinancialSource,
                            UserId = cardTx.UserId,
                            InstallmentCount = cardTx.InstallmentCount
                        });
                    }
                }
                else
                {
                    projectedTransactions.Add(cardTx);
                }
            }

            // 3. PROJEÇÃO DE TRANSACÕES FIXAS (Sua lógica atual)
            if (fixedTransactions.Any())
            {
                DateTime startDate = DateTime.UtcNow.AddMonths(-2);
                for (int i = 0; i < 14; i++)
                {
                    DateTime currentMonth = startDate.AddMonths(i);
                    foreach (var fixedTx in fixedTransactions)
                    {
                        int day = Math.Min(fixedTx.DayOfMonth.Value, DateTime.DaysInMonth(currentMonth.Year, currentMonth.Month));
                        var projectedDate = new DateTime(currentMonth.Year, currentMonth.Month, day, 0, 0, 0, DateTimeKind.Utc);

                        if (projectedDate.Date >= fixedTx.PurchaseDate.Date)
                        {
                            projectedTransactions.Add(new Transaction
                            {
                                Id = fixedTx.Id,
                                Description = fixedTx.Description,
                                TotalAmount = fixedTx.TotalAmount,
                                TransactionType = fixedTx.TransactionType,
                                PurchaseDate = projectedDate,
                                IsInstallment = false,
                                IsFixed = true,
                                IsPaid = false,
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

            var financialSource = await _financialSourceRepository.GetByIdAsync(updateDto.FinancialSourceId, userId);
            if (financialSource == null) throw new InvalidOperationException("Financial Source not found.");

            // Limpa o nome para evitar (1/1) (1/1)
            string cleanDescription = System.Text.RegularExpressions.Regex.Replace(updateDto.Description, @"\s\(\d+/\d+\)$", "");

            // Valor da parcela atual (Total / Count)
            decimal currentInstallmentAmount = (transaction.IsInstallment && transaction.InstallmentCount > 0)
                ? transaction.TotalAmount / transaction.InstallmentCount.Value
                : transaction.TotalAmount;

            // Verificação de recálculo baseada na data ORIGINAL
            bool needsRecalculation = transaction.IsInstallment != updateDto.IsInstallment ||
                                      transaction.InstallmentCount != updateDto.InstallmentCount ||
                                      transaction.FinancialSourceId != updateDto.FinancialSourceId ||
                                      transaction.OriginalPurchaseDate.Date != updateDto.PurchaseDate.Date ||
                                      currentInstallmentAmount != updateDto.TotalAmount;

            transaction.Description = cleanDescription;
            transaction.TransactionType = updateDto.TransactionType;

            transaction.PurchaseDate = updateDto.PurchaseDate;
            transaction.OriginalPurchaseDate = updateDto.PurchaseDate;

            transaction.IsPaid = updateDto.IsPaid;
            transaction.CategoryId = updateDto.CategoryId;
            transaction.FinancialSourceId = updateDto.FinancialSourceId;
            transaction.IsFixed = updateDto.IsFixed;
            transaction.DayOfMonth = updateDto.IsFixed ? updateDto.DayOfMonth : null;
            transaction.IsInstallment = updateDto.IsInstallment;
            transaction.InstallmentCount = updateDto.InstallmentCount;
            transaction.TotalAmount = updateDto.TotalAmount;

            if (needsRecalculation)
            {
                transaction.CardInstallments?.Clear();
                GenerateInstallments(transaction, financialSource);
            }

            _transactionRepository.Update(transaction);
            return await _transactionRepository.SaveChangesAsync();
        }

        private void GenerateInstallments(Transaction transaction, FinancialSource financialSource)
        {
            bool isCreditCard = financialSource.Type == FinancialSourceType.Card;

            if ((transaction.IsInstallment && transaction.InstallmentCount > 0) || isCreditCard)
            {
                transaction.CardInstallments ??= new List<CardInstallment>();
                int count = (transaction.InstallmentCount ?? 1);
                decimal installmentValue = transaction.TotalAmount;
                transaction.TotalAmount = installmentValue * count;

                var purchaseDate = transaction.PurchaseDate;
                DateTime firstInstallmentDueDate;

                if (isCreditCard && financialSource.ClosingDay.HasValue && financialSource.DueDay.HasValue)
                {
                    DateTime invoiceRef = purchaseDate;
                    var closingDate = GetValidDate(purchaseDate.Year, purchaseDate.Month, financialSource.ClosingDay.Value);

                    if (purchaseDate.Date >= closingDate.Date)
                        invoiceRef = invoiceRef.AddMonths(1);

                    firstInstallmentDueDate = GetValidDate(invoiceRef.Year, invoiceRef.Month, financialSource.DueDay.Value);

                    if (financialSource.DueDay.Value < financialSource.ClosingDay.Value)
                        firstInstallmentDueDate = firstInstallmentDueDate.AddMonths(1);
                }
                else
                {
                    firstInstallmentDueDate = purchaseDate.AddMonths(1);
                }

                for (int i = 1; i <= count; i++)
                {
                    transaction.CardInstallments.Add(new CardInstallment
                    {
                        InstallmentNumber = i,
                        Amount = installmentValue,
                        IsPaid = false,
                        DueDate = firstInstallmentDueDate.AddMonths(i - 1)
                    });
                }
            }
        }

        // Helper Obrigatório para evitar erros em dias como 31/Fev
        private DateTime GetValidDate(int year, int month, int day)
        {
            int daysInMonth = DateTime.DaysInMonth(year, month);
            return new DateTime(year, month, Math.Min(day, daysInMonth));
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
                IsFixed = transaction.IsFixed,
                DayOfMonth = transaction.DayOfMonth,
                CategoryId = transaction.CategoryId,
                CategoryName = transaction.Category?.Name,
                FinancialSourceId = transaction.FinancialSourceId,
                FinancialSourceName = transaction.FinancialSource?.Name,
                UserId = transaction.UserId,
                CardInstallments = transaction.CardInstallments?.Select(ci => new CardInstallmentReadDto
                {
                    Id = ci.Id,
                    InstallmentNumber = ci.InstallmentNumber,
                    Amount = ci.Amount,
                    IsPaid = ci.IsPaid,
                    TransactionId = ci.TransactionId,
                    DueDate = ci.DueDate
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
