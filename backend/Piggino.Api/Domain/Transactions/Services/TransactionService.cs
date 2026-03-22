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
using System.Text.RegularExpressions;

namespace Piggino.Api.Domain.Transactions.Services
{
    public class TransactionService : ITransactionService
    {
        private const int FixedTransactionProjectionMonthsBefore = 2;
        private const int FixedTransactionProjectionTotalMonths = 14;
        private const int FallbackInstallmentCount = 1;
        private const string InstallmentSuffixPattern = @"\s\(\d+/\d+\)$";

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

        public async Task<TransactionReadDto> CreateAsync(TransactionCreateDto createDto)
        {
            Guid userId = GetCurrentUserId();

            var category = await _categoryRepository.GetByIdAsync(createDto.CategoryId, userId);
            var financialSource = await _financialSourceRepository.GetByIdAsync(createDto.FinancialSourceId, userId);

            if (category == null || financialSource == null)
                throw new InvalidOperationException("Category or Financial Source not found or does not belong to the user.");

            Transaction newTransaction = BuildTransactionFromCreateDto(createDto, userId);

            GenerateInstallments(newTransaction, financialSource);
            await _transactionRepository.AddAsync(newTransaction);
            await _transactionRepository.SaveChangesAsync();

            return MapToReadDto(newTransaction);
        }

        public async Task<bool> DeleteAsync(int id, RecurrenceScope scope = RecurrenceScope.OnlyThis)
        {
            Guid userId = GetCurrentUserId();
            Transaction? anchor = await _transactionRepository.GetByIdAsync(id, userId);

            if (anchor == null) return false;

            if (!anchor.IsRecurring || scope == RecurrenceScope.OnlyThis)
            {
                _transactionRepository.Delete(anchor);
                return await _transactionRepository.SaveChangesAsync();
            }

            IEnumerable<Transaction> group = await _transactionRepository.GetRecurrenceGroupAsync(anchor, userId);
            IEnumerable<Transaction> targets = FilterGroupByScope(group, anchor.PurchaseDate, scope);

            foreach (Transaction target in targets)
                _transactionRepository.Delete(target);

            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<bool> DeleteInstallmentsByScope(int transactionId, int anchorInstallmentNumber, RecurrenceScope scope)
        {
            Guid userId = GetCurrentUserId();
            Transaction? transaction = await _transactionRepository.GetByIdWithInstallmentsAsync(transactionId, userId);

            if (transaction == null) return false;
            if (transaction.CardInstallments == null || !transaction.CardInstallments.Any()) return false;

            List<CardInstallment> targets = FilterInstallmentsByScope(
                transaction.CardInstallments, anchorInstallmentNumber, scope).ToList();

            foreach (CardInstallment installment in targets)
                _transactionRepository.DeleteCardInstallment(installment);

            bool noInstallmentsRemain = transaction.CardInstallments
                .All(i => targets.Contains(i));

            if (noInstallmentsRemain)
                _transactionRepository.Delete(transaction);

            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<bool> UpdateInstallmentsByScope(int transactionId, int anchorInstallmentNumber, TransactionUpdateDto updateDto)
        {
            Guid userId = GetCurrentUserId();
            Transaction? transaction = await _transactionRepository.GetByIdWithInstallmentsAsync(transactionId, userId);

            if (transaction == null) return false;
            if (transaction.CardInstallments == null || !transaction.CardInstallments.Any()) return false;

            IEnumerable<CardInstallment> targets = FilterInstallmentsByScope(
                transaction.CardInstallments, anchorInstallmentNumber, updateDto.RecurrenceScope ?? RecurrenceScope.OnlyThis);

            foreach (CardInstallment installment in targets)
                installment.Amount = updateDto.TotalAmount;

            transaction.Description = StripInstallmentSuffix(updateDto.Description);
            transaction.CategoryId = updateDto.CategoryId;
            transaction.TransactionType = updateDto.TransactionType;

            _transactionRepository.Update(transaction);
            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<IEnumerable<TransactionReadDto>> GetAllAsync()
        {
            Guid userId = GetCurrentUserId();
            IEnumerable<Transaction> allTransactions = await _transactionRepository.GetAllAsync(userId);

            List<Transaction> projected = new List<Transaction>();

            projected.AddRange(GetNormalTransactions(allTransactions));
            projected.AddRange(ProjectCreditCardTransactions(allTransactions));
            projected.AddRange(ProjectFixedTransactions(allTransactions));

            return projected
                .OrderByDescending(t => t.PurchaseDate)
                .Select(MapToReadDto);
        }

        public async Task<TransactionReadDto?> GetByIdAsync(int id)
        {
            Guid userId = GetCurrentUserId();
            Transaction? transaction = await _transactionRepository.GetByIdAsync(id, userId);

            if (transaction == null) return null;

            return MapToReadDto(transaction);
        }

        public async Task<bool> UpdateAsync(int id, TransactionUpdateDto updateDto)
        {
            Guid userId = GetCurrentUserId();
            Transaction? anchor = await _transactionRepository.GetByIdWithInstallmentsAsync(id, userId);

            if (anchor == null) return false;

            var financialSource = await _financialSourceRepository.GetByIdAsync(updateDto.FinancialSourceId, userId);
            if (financialSource == null)
                throw new InvalidOperationException("Financial Source not found.");

            RecurrenceScope scope = updateDto.RecurrenceScope ?? RecurrenceScope.OnlyThis;

            if (!anchor.IsRecurring || scope == RecurrenceScope.OnlyThis)
            {
                ApplySingleTransactionUpdate(anchor, updateDto, financialSource);
                _transactionRepository.Update(anchor);
                return await _transactionRepository.SaveChangesAsync();
            }

            IEnumerable<Transaction> group = await _transactionRepository.GetRecurrenceGroupAsync(anchor, userId);
            IEnumerable<Transaction> targets = FilterGroupByScope(group, anchor.PurchaseDate, scope);

            foreach (Transaction target in targets)
            {
                Transaction? targetWithInstallments = await _transactionRepository.GetByIdWithInstallmentsAsync(target.Id, userId);
                if (targetWithInstallments == null) continue;

                ApplySingleTransactionUpdate(targetWithInstallments, updateDto, financialSource);
                _transactionRepository.Update(targetWithInstallments);
            }

            return await _transactionRepository.SaveChangesAsync();
        }

        private void ApplySingleTransactionUpdate(Transaction transaction, TransactionUpdateDto updateDto, FinancialSource financialSource)
        {
            bool needsInstallmentRecalculation = InstallmentRecalculationRequired(transaction, updateDto);

            ApplyUpdateFields(transaction, updateDto);

            if (!needsInstallmentRecalculation) return;

            transaction.CardInstallments?.Clear();
            GenerateInstallments(transaction, financialSource);
        }

        public async Task<bool> ToggleInstallmentPaidStatusAsync(int installmentId)
        {
            Guid userId = GetCurrentUserId();
            var installment = await _transactionRepository.GetCardInstallmentByIdAsync(installmentId);

            if (installment == null) return false;

            var ownerTransaction = await _transactionRepository.GetByIdWithInstallmentsAndSourceAsync(installment.TransactionId, userId);
            if (ownerTransaction == null) return false;

            installment.IsPaid = !installment.IsPaid;
            await _transactionRepository.SaveChangesAsync();

            bool shouldTriggerRecurrence = ownerTransaction.IsRecurring
                && installment.IsPaid
                && AllInstallmentsArePaid(ownerTransaction);

            if (shouldTriggerRecurrence)
                await GenerateRecurringCycleAsync(ownerTransaction, userId);

            return true;
        }

        public async Task<bool> ToggleTransactionPaidStatusAsync(int transactionId)
        {
            Guid userId = GetCurrentUserId();
            var transaction = await _transactionRepository.GetByIdAsync(transactionId, userId);

            if (transaction == null) return false;
            if (transaction.IsInstallment) return false;

            transaction.IsPaid = !transaction.IsPaid;
            _transactionRepository.Update(transaction);
            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<bool> PayInvoiceAsync(int financialSourceId, int year, int month)
        {
            Guid userId = GetCurrentUserId();

            FinancialSource? financialSource = await _financialSourceRepository.GetByIdAsync(financialSourceId, userId);
            if (financialSource == null) return false;

            IEnumerable<CardInstallment> installments = await _transactionRepository
                .GetInstallmentsForInvoiceAsync(financialSourceId, year, month, userId);

            foreach (CardInstallment installment in installments)
                installment.IsPaid = true;

            await _transactionRepository.SaveChangesAsync();
            return true;
        }

        public async Task<InvoiceReadDto?> GetInvoiceAsync(int financialSourceId, int year, int month)
        {
            Guid userId = GetCurrentUserId();

            FinancialSource? financialSource = await _financialSourceRepository.GetByIdAsync(financialSourceId, userId);
            if (financialSource == null) return null;

            IEnumerable<CardInstallment> installments = await _transactionRepository
                .GetInstallmentsForInvoiceAsync(financialSourceId, year, month, userId);

            int closingDay = financialSource.ClosingDay ?? 1;
            int dueDay = financialSource.DueDay ?? 1;

            DateTime closingDate = GetSafeDayInMonth(year, month, closingDay);
            DateTime dueDate = ResolveDueDate(year, month, closingDay, dueDay);

            IEnumerable<InvoiceItemDto> items = installments.Select(i => MapToInvoiceItemDto(i));
            decimal totalAmount = items.Sum(i => i.Amount);

            return new InvoiceReadDto
            {
                FinancialSourceId = financialSource.Id,
                FinancialSourceName = financialSource.Name ?? string.Empty,
                ClosingDay = closingDay,
                DueDay = dueDay,
                Month = $"{year:D4}-{month:D2}",
                ClosingDate = closingDate,
                DueDate = dueDate,
                TotalAmount = totalAmount,
                Items = items
            };
        }

        public async Task<MonthlyFixedBillsReadDto> GetMonthlyFixedBillsAsync(int year, int month)
        {
            Guid userId = GetCurrentUserId();

            IEnumerable<Transaction> fixedTransactions = await _transactionRepository.GetFixedTransactionsAsync(userId);
            IEnumerable<FixedTransactionPayment> payments = await _transactionRepository.GetFixedPaymentsForMonthAsync(userId, year, month);

            Dictionary<int, FixedTransactionPayment> paymentByTransactionId = payments
                .ToDictionary(p => p.TransactionId);

            List<FixedBillReadDto> items = fixedTransactions
                .Select(t => MapToFixedBillReadDto(t, paymentByTransactionId))
                .OrderBy(b => b.DayOfMonth)
                .ToList();

            decimal totalAmount = items.Sum(b => b.TotalAmount);
            decimal paidAmount = items.Where(b => b.IsPaid).Sum(b => b.TotalAmount);
            decimal pendingAmount = totalAmount - paidAmount;

            return new MonthlyFixedBillsReadDto
            {
                Year = year,
                Month = month,
                TotalAmount = totalAmount,
                PaidAmount = paidAmount,
                PendingAmount = pendingAmount,
                Items = items
            };
        }

        public async Task<bool> MarkFixedBillAsPaidAsync(int transactionId, int year, int month)
        {
            Guid userId = GetCurrentUserId();

            Transaction? transaction = await _transactionRepository.GetByIdAsync(transactionId, userId);
            if (transaction == null || !transaction.IsFixed) return false;

            FixedTransactionPayment? existing = await _transactionRepository.GetFixedPaymentAsync(transactionId, year, month);

            if (existing != null)
            {
                existing.IsPaid = true;
                existing.PaidAt = DateTime.UtcNow;
            }
            else
            {
                await _transactionRepository.AddFixedPaymentAsync(new FixedTransactionPayment
                {
                    TransactionId = transactionId,
                    Year = year,
                    Month = month,
                    IsPaid = true,
                    PaidAt = DateTime.UtcNow
                });
            }

            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<bool> UnmarkFixedBillAsPaidAsync(int transactionId, int year, int month)
        {
            Guid userId = GetCurrentUserId();

            Transaction? transaction = await _transactionRepository.GetByIdAsync(transactionId, userId);
            if (transaction == null || !transaction.IsFixed) return false;

            FixedTransactionPayment? existing = await _transactionRepository.GetFixedPaymentAsync(transactionId, year, month);
            if (existing == null) return false;

            _transactionRepository.DeleteFixedPayment(existing);
            return await _transactionRepository.SaveChangesAsync();
        }

        private static FixedBillReadDto MapToFixedBillReadDto(Transaction transaction, Dictionary<int, FixedTransactionPayment> paymentMap)
        {
            paymentMap.TryGetValue(transaction.Id, out FixedTransactionPayment? payment);

            return new FixedBillReadDto
            {
                TransactionId = transaction.Id,
                Description = transaction.Description ?? string.Empty,
                TotalAmount = transaction.TotalAmount,
                CategoryName = transaction.Category?.Name,
                FinancialSourceName = transaction.FinancialSource?.Name,
                DayOfMonth = transaction.DayOfMonth ?? 1,
                IsPaid = payment?.IsPaid ?? false,
                PaymentId = payment?.Id
            };
        }

        private static DateTime ResolveDueDate(int year, int month, int closingDay, int dueDay)
        {
            DateTime dueDate = GetSafeDayInMonth(year, month, dueDay);

            if (dueDay < closingDay)
                dueDate = dueDate.AddMonths(1);

            return dueDate;
        }

        private static InvoiceItemDto MapToInvoiceItemDto(CardInstallment installment)
        {
            Transaction transaction = installment.Transaction!;
            bool hasMultipleInstallments = transaction.InstallmentCount > 1;
            string description = hasMultipleInstallments
                ? $"{transaction.Description} ({installment.InstallmentNumber}/{transaction.InstallmentCount})"
                : transaction.Description ?? string.Empty;

            return new InvoiceItemDto
            {
                TransactionId = transaction.Id,
                InstallmentId = installment.Id,
                Description = description,
                Amount = installment.Amount,
                PurchaseDate = transaction.PurchaseDate,
                InstallmentNumber = installment.InstallmentNumber,
                InstallmentCount = transaction.InstallmentCount ?? FallbackInstallmentCount,
                IsPaid = installment.IsPaid,
                CategoryName = transaction.Category?.Name
            };
        }

        // --- Recurrence ---

        private static bool AllInstallmentsArePaid(Transaction transaction)
        {
            return transaction.CardInstallments != null
                && transaction.CardInstallments.Any()
                && transaction.CardInstallments.All(i => i.IsPaid);
        }

        private async Task GenerateRecurringCycleAsync(Transaction completedTransaction, Guid userId)
        {
            DateTime nextCycleStartDate = ResolveNextCycleStartDate(completedTransaction);

            decimal installmentAmount = ResolveInstallmentAmount(completedTransaction);

            Transaction nextCycle = new Transaction
            {
                Description = completedTransaction.Description,
                TotalAmount = completedTransaction.TotalAmount,
                TransactionType = completedTransaction.TransactionType,
                PurchaseDate = nextCycleStartDate,
                IsInstallment = completedTransaction.IsInstallment,
                InstallmentCount = completedTransaction.InstallmentCount,
                IsPaid = false,
                IsFixed = false,
                DayOfMonth = null,
                IsRecurring = true,
                CategoryId = completedTransaction.CategoryId,
                FinancialSourceId = completedTransaction.FinancialSourceId,
                UserId = userId,
                CardInstallments = new List<CardInstallment>()
            };

            GenerateInstallmentsFromAmount(nextCycle, completedTransaction.FinancialSource!, installmentAmount);

            await _transactionRepository.AddAsync(nextCycle);
            await _transactionRepository.SaveChangesAsync();
        }

        private static DateTime ResolveNextCycleStartDate(Transaction transaction)
        {
            if (transaction.CardInstallments == null || !transaction.CardInstallments.Any())
                return transaction.PurchaseDate.AddMonths(transaction.InstallmentCount ?? FallbackInstallmentCount);

            DateTime lastDueDate = transaction.CardInstallments
                .OrderByDescending(i => i.InstallmentNumber)
                .First()
                .DueDate;

            return lastDueDate.AddMonths(1);
        }

        private static decimal ResolveInstallmentAmount(Transaction transaction)
        {
            int count = transaction.InstallmentCount ?? FallbackInstallmentCount;
            return count > 0 ? transaction.TotalAmount / count : transaction.TotalAmount;
        }

        // --- Projection helpers ---

        private static IEnumerable<Transaction> GetNormalTransactions(IEnumerable<Transaction> transactions)
        {
            return transactions.Where(t =>
                !t.IsFixed &&
                (t.FinancialSource == null || t.FinancialSource.Type != FinancialSourceType.Card));
        }

        private static IEnumerable<Transaction> ProjectCreditCardTransactions(IEnumerable<Transaction> transactions)
        {
            var creditCardTransactions = transactions.Where(t =>
                !t.IsFixed &&
                t.FinancialSource != null &&
                t.FinancialSource.Type == FinancialSourceType.Card);

            var projected = new List<Transaction>();

            foreach (var transaction in creditCardTransactions)
            {
                if (transaction.CardInstallments == null || !transaction.CardInstallments.Any())
                {
                    projected.Add(transaction);
                    continue;
                }

                foreach (var installment in transaction.CardInstallments)
                    projected.Add(ProjectInstallmentAsTransaction(transaction, installment));
            }

            return projected;
        }

        private static Transaction ProjectInstallmentAsTransaction(Transaction source, CardInstallment installment)
        {
            bool hasMultipleInstallments = source.InstallmentCount > 1;
            string description = hasMultipleInstallments
                ? $"{source.Description} ({installment.InstallmentNumber}/{source.InstallmentCount})"
                : source.Description ?? string.Empty;

            return new Transaction
            {
                Id = source.Id,
                Description = description,
                TotalAmount = installment.Amount,
                TransactionType = source.TransactionType,
                PurchaseDate = installment.DueDate,
                IsInstallment = true,
                IsFixed = false,
                IsRecurring = source.IsRecurring,
                IsPaid = installment.IsPaid,
                CategoryId = source.CategoryId,
                Category = source.Category,
                FinancialSourceId = source.FinancialSourceId,
                FinancialSource = source.FinancialSource,
                UserId = source.UserId,
                InstallmentCount = source.InstallmentCount,
                CurrentInstallmentNumber = installment.InstallmentNumber
            };
        }

        private static IEnumerable<Transaction> ProjectFixedTransactions(IEnumerable<Transaction> transactions)
        {
            var fixedTransactions = transactions
                .Where(t => t.IsFixed && t.DayOfMonth.HasValue)
                .ToList();

            if (!fixedTransactions.Any()) return Enumerable.Empty<Transaction>();

            var projected = new List<Transaction>();
            DateTime windowStart = DateTime.UtcNow.AddMonths(-FixedTransactionProjectionMonthsBefore);

            for (int monthOffset = 0; monthOffset < FixedTransactionProjectionTotalMonths; monthOffset++)
            {
                DateTime month = windowStart.AddMonths(monthOffset);

                foreach (var fixedTransaction in fixedTransactions)
                {
                    DateTime projectedDate = GetSafeDayInMonth(month.Year, month.Month, fixedTransaction.DayOfMonth!.Value);

                    if (projectedDate.Date < fixedTransaction.PurchaseDate.Date) continue;

                    projected.Add(ProjectFixedTransactionToMonth(fixedTransaction, projectedDate));
                }
            }

            return projected;
        }

        private static Transaction ProjectFixedTransactionToMonth(Transaction source, DateTime projectedDate)
        {
            return new Transaction
            {
                Id = source.Id,
                Description = source.Description,
                TotalAmount = source.TotalAmount,
                TransactionType = source.TransactionType,
                PurchaseDate = projectedDate,
                IsInstallment = false,
                IsFixed = true,
                IsRecurring = false,
                IsPaid = false,
                CategoryId = source.CategoryId,
                Category = source.Category,
                FinancialSourceId = source.FinancialSourceId,
                FinancialSource = source.FinancialSource,
                UserId = source.UserId,
                DayOfMonth = source.DayOfMonth
            };
        }

        // --- Installment generation ---

        private void GenerateInstallments(Transaction transaction, FinancialSource financialSource)
        {
            bool isCreditCard = financialSource.Type == FinancialSourceType.Card;
            bool hasInstallments = transaction.IsInstallment && transaction.InstallmentCount > 0;

            if (!hasInstallments && !isCreditCard) return;

            transaction.CardInstallments ??= new List<CardInstallment>();

            int count = transaction.InstallmentCount ?? FallbackInstallmentCount;
            decimal installmentAmount = transaction.TotalAmount;
            transaction.TotalAmount = installmentAmount * count;

            DateTime firstDueDate = CalculateFirstDueDate(transaction.PurchaseDate, financialSource, isCreditCard);

            for (int installmentNumber = 1; installmentNumber <= count; installmentNumber++)
            {
                transaction.CardInstallments.Add(new CardInstallment
                {
                    InstallmentNumber = installmentNumber,
                    Amount = installmentAmount,
                    IsPaid = false,
                    DueDate = firstDueDate.AddMonths(installmentNumber - 1)
                });
            }
        }

        private static void GenerateInstallmentsFromAmount(Transaction transaction, FinancialSource financialSource, decimal installmentAmount)
        {
            bool isCreditCard = financialSource.Type == FinancialSourceType.Card;

            transaction.CardInstallments ??= new List<CardInstallment>();

            int count = transaction.InstallmentCount ?? FallbackInstallmentCount;
            DateTime firstDueDate = CalculateFirstDueDate(transaction.PurchaseDate, financialSource, isCreditCard);

            for (int installmentNumber = 1; installmentNumber <= count; installmentNumber++)
            {
                transaction.CardInstallments.Add(new CardInstallment
                {
                    InstallmentNumber = installmentNumber,
                    Amount = installmentAmount,
                    IsPaid = false,
                    DueDate = firstDueDate.AddMonths(installmentNumber - 1)
                });
            }
        }

        private static DateTime CalculateFirstDueDate(DateTime purchaseDate, FinancialSource financialSource, bool isCreditCard)
        {
            if (!isCreditCard || !financialSource.ClosingDay.HasValue || !financialSource.DueDay.HasValue)
                return purchaseDate.AddMonths(1);

            DateTime invoiceReferenceMonth = purchaseDate;
            DateTime closingDate = GetSafeDayInMonth(purchaseDate.Year, purchaseDate.Month, financialSource.ClosingDay.Value);

            if (purchaseDate.Date >= closingDate.Date)
                invoiceReferenceMonth = invoiceReferenceMonth.AddMonths(1);

            DateTime dueDate = GetSafeDayInMonth(invoiceReferenceMonth.Year, invoiceReferenceMonth.Month, financialSource.DueDay.Value);

            // When the due day falls before the closing day, the bill closes in the current cycle
            // but is only due in the following month.
            if (financialSource.DueDay.Value < financialSource.ClosingDay.Value)
                dueDate = dueDate.AddMonths(1);

            return dueDate;
        }

        // --- Update helpers ---

        private static bool InstallmentRecalculationRequired(Transaction existing, TransactionUpdateDto updateDto)
        {
            decimal currentInstallmentAmount = existing.IsInstallment && existing.InstallmentCount > 0
                ? existing.TotalAmount / existing.InstallmentCount!.Value
                : existing.TotalAmount;

            return existing.IsInstallment != updateDto.IsInstallment
                || existing.InstallmentCount != updateDto.InstallmentCount
                || existing.FinancialSourceId != updateDto.FinancialSourceId
                || currentInstallmentAmount != updateDto.TotalAmount;
        }

        private static void ApplyUpdateFields(Transaction transaction, TransactionUpdateDto updateDto)
        {
            transaction.Description = StripInstallmentSuffix(updateDto.Description);
            transaction.TransactionType = updateDto.TransactionType;
            transaction.PurchaseDate = updateDto.PurchaseDate;
            transaction.IsPaid = updateDto.IsPaid;
            transaction.CategoryId = updateDto.CategoryId;
            transaction.FinancialSourceId = updateDto.FinancialSourceId;
            transaction.IsFixed = updateDto.IsFixed;
            transaction.DayOfMonth = updateDto.IsFixed ? updateDto.DayOfMonth : null;
            transaction.IsInstallment = updateDto.IsInstallment;
            transaction.InstallmentCount = updateDto.InstallmentCount;
            transaction.TotalAmount = updateDto.TotalAmount;
            transaction.IsRecurring = updateDto.IsRecurring;
        }

        // --- Mapping ---

        private static TransactionReadDto MapToReadDto(Transaction transaction)
        {
            return new TransactionReadDto
            {
                Id = transaction.Id,
                Description = transaction.Description ?? string.Empty,
                TotalAmount = transaction.TotalAmount,
                TransactionType = transaction.TransactionType,
                PurchaseDate = transaction.PurchaseDate,
                IsInstallment = transaction.IsInstallment,
                InstallmentCount = transaction.InstallmentCount,
                CurrentInstallmentNumber = transaction.CurrentInstallmentNumber,
                IsPaid = transaction.IsPaid,
                IsFixed = transaction.IsFixed,
                DayOfMonth = transaction.DayOfMonth,
                IsRecurring = transaction.IsRecurring,
                CategoryId = transaction.CategoryId,
                CategoryName = transaction.Category?.Name,
                FinancialSourceId = transaction.FinancialSourceId,
                FinancialSourceName = transaction.FinancialSource?.Name,
                UserId = transaction.UserId,
                CardInstallments = transaction.CardInstallments?
                    .Select(MapCardInstallmentToReadDto)
                    .ToList()
            };
        }

        private static CardInstallmentReadDto MapCardInstallmentToReadDto(CardInstallment installment)
        {
            return new CardInstallmentReadDto
            {
                Id = installment.Id,
                InstallmentNumber = installment.InstallmentNumber,
                Amount = installment.Amount,
                IsPaid = installment.IsPaid,
                TransactionId = installment.TransactionId,
                DueDate = installment.DueDate
            };
        }

        // --- Recurrence scope filtering ---

        private static IEnumerable<Transaction> FilterGroupByScope(
            IEnumerable<Transaction> group,
            DateTime anchorDate,
            RecurrenceScope scope)
        {
            return scope switch
            {
                RecurrenceScope.ThisAndFuture => group.Where(t => t.PurchaseDate.Date >= anchorDate.Date),
                RecurrenceScope.ThisAndPast   => group.Where(t => t.PurchaseDate.Date <= anchorDate.Date),
                RecurrenceScope.All           => group,
                _                             => group.Where(t => t.PurchaseDate.Date == anchorDate.Date)
            };
        }

        private static IEnumerable<CardInstallment> FilterInstallmentsByScope(
            IEnumerable<CardInstallment> installments,
            int anchorNumber,
            RecurrenceScope scope)
        {
            return scope switch
            {
                RecurrenceScope.ThisAndFuture => installments.Where(i => i.InstallmentNumber >= anchorNumber),
                RecurrenceScope.ThisAndPast   => installments.Where(i => i.InstallmentNumber <= anchorNumber),
                RecurrenceScope.All           => installments,
                _                             => installments.Where(i => i.InstallmentNumber == anchorNumber)
            };
        }

        // --- Utility ---

        private Guid GetCurrentUserId()
        {
            string? userId = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("User is not authenticated.");

            return Guid.Parse(userId);
        }

        private static Transaction BuildTransactionFromCreateDto(TransactionCreateDto createDto, Guid userId)
        {
            return new Transaction
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
                DayOfMonth = createDto.IsFixed ? createDto.DayOfMonth : null,
                IsRecurring = createDto.IsRecurring
            };
        }

        private static string StripInstallmentSuffix(string description)
        {
            return Regex.Replace(description, InstallmentSuffixPattern, string.Empty);
        }

        private static DateTime GetSafeDayInMonth(int year, int month, int day)
        {
            int daysInMonth = DateTime.DaysInMonth(year, month);
            return new DateTime(year, month, Math.Min(day, daysInMonth), 0, 0, 0, DateTimeKind.Utc);
        }
    }
}
