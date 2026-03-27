using Piggino.Api.Domain.CardInstallments.Dtos;
using Piggino.Api.Domain.CardInstallments.Entities;
using Piggino.Api.Domain.Categories.Interfaces;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.FinancialSources.Interfaces;
using Piggino.Api.Domain.Goals.Entities;
using Piggino.Api.Domain.Goals.Interfaces;
using Piggino.Api.Domain.Tithe.Interfaces;
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
        private const int FixedTransactionProjectionMonthsForward = 3;
        private const int FallbackInstallmentCount = 1;
        private const string InstallmentSuffixPattern = @"\s\(\d+/\d+\)$";

        private readonly ITransactionRepository _transactionRepository;
        private readonly IFinancialSourceRepository _financialSourceRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IGoalRepository _goalRepository;
        private readonly ITitheService _titheService;

        public TransactionService(
            ITransactionRepository transactionRepository,
            IFinancialSourceRepository financialSourceRepository,
            ICategoryRepository categoryRepository,
            IHttpContextAccessor httpContextAccessor,
            IGoalRepository goalRepository,
            ITitheService titheService)
        {
            _transactionRepository = transactionRepository;
            _financialSourceRepository = financialSourceRepository;
            _categoryRepository = categoryRepository;
            _httpContextAccessor = httpContextAccessor;
            _goalRepository = goalRepository;
            _titheService = titheService;
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

            if (newTransaction.TransactionType == TransactionType.Income)
                await _titheService.RecalculateTitheForCategoryAsync(
                    userId, newTransaction.CategoryId, newTransaction.PurchaseDate.Year, newTransaction.PurchaseDate.Month);

            if (createDto.GoalId.HasValue)
                await ApplyGoalContributionAsync(createDto.GoalId.Value, userId);

            return MapToReadDto(newTransaction);
        }

        public async Task<bool> DeleteAsync(int id, RecurrenceScope scope = RecurrenceScope.OnlyThis)
        {
            Guid userId = GetCurrentUserId();
            Transaction? anchor = await _transactionRepository.GetByIdAsync(id, userId);

            if (anchor == null) return false;

            bool isIncomeDeletion = anchor.TransactionType == TransactionType.Income;
            int affectedCategoryId = anchor.CategoryId;
            int affectedYear = anchor.PurchaseDate.Year;
            int affectedMonth = anchor.PurchaseDate.Month;

            if (!anchor.IsRecurring || scope == RecurrenceScope.OnlyThis)
            {
                _transactionRepository.Delete(anchor);
                bool saved = await _transactionRepository.SaveChangesAsync();

                if (saved && isIncomeDeletion)
                    await _titheService.RecalculateTitheForCategoryAsync(userId, affectedCategoryId, affectedYear, affectedMonth);

                return saved;
            }

            IEnumerable<Transaction> group = await _transactionRepository.GetRecurrenceGroupAsync(anchor, userId);
            IEnumerable<Transaction> targets = FilterGroupByScope(group, anchor.PurchaseDate, scope).ToList();

            foreach (Transaction target in targets)
                _transactionRepository.Delete(target);

            bool groupSaved = await _transactionRepository.SaveChangesAsync();

            if (groupSaved && isIncomeDeletion)
            {
                IEnumerable<(int year, int month)> affectedMonths = targets
                    .Select(t => (t.PurchaseDate.Year, t.PurchaseDate.Month))
                    .Distinct();

                foreach ((int year, int month) in affectedMonths)
                    await _titheService.RecalculateTitheForCategoryAsync(userId, affectedCategoryId, year, month);
            }

            return groupSaved;
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
            IEnumerable<FixedTransactionPayment> fixedPayments = await _transactionRepository.GetAllFixedPaymentsAsync(userId);

            HashSet<(int transactionId, int year, int month)> paidFixedBillKeys = fixedPayments
                .Select(p => (p.TransactionId, p.Year, p.Month))
                .ToHashSet();

            List<Transaction> projected = new List<Transaction>();

            projected.AddRange(GetNormalTransactions(allTransactions));
            projected.AddRange(ProjectInstallmentTransactions(allTransactions));
            projected.AddRange(ProjectFixedTransactions(allTransactions, paidFixedBillKeys));

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

            bool isIncomeUpdate = anchor.TransactionType == TransactionType.Income
                || updateDto.TransactionType == TransactionType.Income;

            int previousCategoryId = anchor.CategoryId;
            int previousYear = anchor.PurchaseDate.Year;
            int previousMonth = anchor.PurchaseDate.Month;

            RecurrenceScope scope = updateDto.RecurrenceScope ?? RecurrenceScope.OnlyThis;

            if (!anchor.IsRecurring || scope == RecurrenceScope.OnlyThis)
            {
                int? oldGoalId = anchor.GoalId;
                bool oldIsPaid = anchor.IsPaid;

                ApplySingleTransactionUpdate(anchor, updateDto, financialSource);
                _transactionRepository.Update(anchor);
                bool saved = await _transactionRepository.SaveChangesAsync();

                if (saved && isIncomeUpdate)
                    await RecalculateTitheForUpdatedTransactionAsync(
                        userId, previousCategoryId, previousYear, previousMonth,
                        anchor.CategoryId, anchor.PurchaseDate.Year, anchor.PurchaseDate.Month);

                if (saved)
                    await RecalculateAffectedGoalsAsync(userId, oldGoalId, oldIsPaid, anchor.GoalId, anchor.IsPaid);

                return saved;
            }

            IEnumerable<Transaction> group = await _transactionRepository.GetRecurrenceGroupAsync(anchor, userId);
            IEnumerable<Transaction> targets = FilterGroupByScope(group, anchor.PurchaseDate, scope).ToList();

            foreach (Transaction target in targets)
            {
                Transaction? targetWithInstallments = await _transactionRepository.GetByIdWithInstallmentsAsync(target.Id, userId);
                if (targetWithInstallments == null) continue;

                ApplySingleTransactionUpdate(targetWithInstallments, updateDto, financialSource);
                _transactionRepository.Update(targetWithInstallments);
            }

            bool groupSaved = await _transactionRepository.SaveChangesAsync();

            if (groupSaved && isIncomeUpdate)
            {
                IEnumerable<(int year, int month)> affectedMonths = targets
                    .Select(t => (t.PurchaseDate.Year, t.PurchaseDate.Month))
                    .Append((previousYear, previousMonth))
                    .Distinct();

                foreach ((int year, int month) in affectedMonths)
                    await _titheService.RecalculateTitheForCategoryAsync(userId, updateDto.CategoryId, year, month);

                if (previousCategoryId != updateDto.CategoryId)
                    await _titheService.RecalculateTitheForCategoryAsync(
                        userId, previousCategoryId, previousYear, previousMonth);
            }

            return groupSaved;
        }

        private async Task RecalculateTitheForUpdatedTransactionAsync(
            Guid userId,
            int previousCategoryId, int previousYear, int previousMonth,
            int newCategoryId, int newYear, int newMonth)
        {
            await _titheService.RecalculateTitheForCategoryAsync(userId, newCategoryId, newYear, newMonth);

            bool categoryChanged = previousCategoryId != newCategoryId;
            bool monthChanged = previousYear != newYear || previousMonth != newMonth;

            if (categoryChanged || monthChanged)
                await _titheService.RecalculateTitheForCategoryAsync(
                    userId, previousCategoryId, previousYear, previousMonth);
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

            bool wasAlreadyPaid = transaction.IsPaid;
            transaction.IsPaid = !transaction.IsPaid;
            _transactionRepository.Update(transaction);
            bool saved = await _transactionRepository.SaveChangesAsync();

            if (saved && transaction.GoalId.HasValue)
                await ApplyGoalContributionAsync(transaction.GoalId.Value, userId);

            return saved;
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
                .Where(t => IsFixedBillActiveForMonth(t, year, month))
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
                if (existing.IsPaid) return true;

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

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(int months, int? year = null, int? month = null)
        {
            IEnumerable<TransactionReadDto> allProjected = await GetAllAsync();

            DateTime now = DateTime.UtcNow;
            int currentYear = year ?? now.Year;
            int currentMonth = month ?? now.Month;
            DateTime selectedMonth = new DateTime(currentYear, currentMonth, 1, 0, 0, 0, DateTimeKind.Utc);

            IEnumerable<MonthlySummaryDto> monthlySummaries = BuildMonthlySummaries(allProjected, selectedMonth, months);
            IEnumerable<CategoryExpenseDto> expensesByCategory = BuildExpensesByCategory(allProjected, currentYear, currentMonth);
            IEnumerable<TopExpenseDto> topExpenses = BuildTopExpenses(allProjected, currentYear, currentMonth);

            decimal currentMonthIncome = SumByTypeForMonth(allProjected, TransactionType.Income, currentYear, currentMonth);
            decimal currentMonthExpenses = SumByTypeForMonth(allProjected, TransactionType.Expense, currentYear, currentMonth);
            decimal currentMonthBalance = currentMonthIncome - currentMonthExpenses;

            int pendingFixedBills = await CountPendingFixedBillsAsync(currentYear, currentMonth);
            decimal pendingInvoiceAmount = await SumPendingInvoiceAmountAsync(currentYear, currentMonth);

            DateTime previousMonthDate = selectedMonth.AddMonths(-1);
            decimal previousMonthIncome = SumByTypeForMonth(allProjected, TransactionType.Income, previousMonthDate.Year, previousMonthDate.Month);
            decimal previousMonthExpenses = SumByTypeForMonth(allProjected, TransactionType.Expense, previousMonthDate.Year, previousMonthDate.Month);
            decimal incomeChangePercent = previousMonthIncome > 0 ? Math.Round((currentMonthIncome - previousMonthIncome) / previousMonthIncome * 100, 1) : 0;
            decimal expensesChangePercent = previousMonthExpenses > 0 ? Math.Round((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses * 100, 1) : 0;

            return new DashboardSummaryDto
            {
                MonthlySummaries = monthlySummaries,
                ExpensesByCategory = expensesByCategory,
                TopExpenses = topExpenses,
                CurrentMonthIncome = currentMonthIncome,
                CurrentMonthExpenses = currentMonthExpenses,
                CurrentMonthBalance = currentMonthBalance,
                PendingFixedBills = pendingFixedBills,
                PendingInvoiceAmount = pendingInvoiceAmount,
                PreviousMonthIncome = previousMonthIncome,
                PreviousMonthExpenses = previousMonthExpenses,
                IncomeChangePercent = incomeChangePercent,
                ExpensesChangePercent = expensesChangePercent
            };
        }

        private static IEnumerable<MonthlySummaryDto> BuildMonthlySummaries(
            IEnumerable<TransactionReadDto> transactions,
            DateTime referenceDate,
            int monthCount)
        {
            List<MonthlySummaryDto> summaries = new List<MonthlySummaryDto>();

            for (int offset = monthCount - 1; offset >= 0; offset--)
            {
                DateTime targetMonth = referenceDate.AddMonths(-offset);
                int year = targetMonth.Year;
                int month = targetMonth.Month;

                decimal income = SumByTypeForMonth(transactions, TransactionType.Income, year, month);
                decimal expenses = SumByTypeForMonth(transactions, TransactionType.Expense, year, month);

                summaries.Add(new MonthlySummaryDto
                {
                    Month = $"{year:D4}-{month:D2}",
                    TotalIncome = income,
                    TotalExpenses = expenses,
                    Balance = income - expenses
                });
            }

            return summaries;
        }

        private static decimal SumByTypeForMonth(
            IEnumerable<TransactionReadDto> transactions,
            TransactionType type,
            int year,
            int month)
        {
            return transactions
                .Where(t =>
                    t.TransactionType == type &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month)
                .Sum(t => t.TotalAmount);
        }

        private static IEnumerable<CategoryExpenseDto> BuildExpensesByCategory(
            IEnumerable<TransactionReadDto> transactions,
            int year,
            int month)
        {
            IEnumerable<TransactionReadDto> monthlyExpenses = transactions
                .Where(t =>
                    t.TransactionType == TransactionType.Expense &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month);

            decimal totalExpenses = monthlyExpenses.Sum(t => t.TotalAmount);

            if (totalExpenses == 0)
                return Enumerable.Empty<CategoryExpenseDto>();

            return monthlyExpenses
                .GroupBy(t => t.CategoryName ?? "Sem categoria")
                .Select(group => new CategoryExpenseDto
                {
                    CategoryName = group.Key,
                    Total = group.Sum(t => t.TotalAmount),
                    Percentage = Math.Round(group.Sum(t => t.TotalAmount) / totalExpenses * 100, 1)
                })
                .OrderByDescending(c => c.Total);
        }

        private static IEnumerable<TopExpenseDto> BuildTopExpenses(
            IEnumerable<TransactionReadDto> transactions,
            int year,
            int month)
        {
            const int TopExpenseLimit = 5;

            return transactions
                .Where(t =>
                    t.TransactionType == TransactionType.Expense &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month)
                .OrderByDescending(t => t.TotalAmount)
                .Take(TopExpenseLimit)
                .Select(t => new TopExpenseDto
                {
                    Description = t.Description,
                    Amount = t.TotalAmount,
                    CategoryName = t.CategoryName
                });
        }

        private async Task<int> CountPendingFixedBillsAsync(int year, int month)
        {
            MonthlyFixedBillsReadDto fixedBills = await GetMonthlyFixedBillsAsync(year, month);
            return fixedBills.Items.Count(b => !b.IsPaid);
        }

        private async Task<decimal> SumPendingInvoiceAmountAsync(int year, int month)
        {
            Guid userId = GetCurrentUserId();

            IEnumerable<CardInstallment> unpaidInstallments = await _transactionRepository
                .GetUnpaidInstallmentsForMonthAsync(userId, year, month);

            return unpaidInstallments.Sum(i => i.Amount);
        }

        public async Task<bool> UnmarkFixedBillAsPaidAsync(int transactionId, int year, int month)
        {
            Guid userId = GetCurrentUserId();

            Transaction? transaction = await _transactionRepository.GetByIdAsync(transactionId, userId);
            if (transaction == null || !transaction.IsFixed) return false;

            FixedTransactionPayment? existing = await _transactionRepository.GetFixedPaymentAsync(transactionId, year, month);
            if (existing == null) return true;

            _transactionRepository.DeleteFixedPayment(existing);
            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<bool> DeleteFixedBillAsync(int id, FixedBillScope scope, int anchorYear, int anchorMonth)
        {
            Guid userId = GetCurrentUserId();
            Transaction? transaction = await _transactionRepository.GetFixedTransactionByIdAsync(id, userId);

            if (transaction == null) return false;

            switch (scope)
            {
                case FixedBillScope.All:
                    _transactionRepository.Delete(transaction);
                    break;

                case FixedBillScope.FromThisMonthForward:
                    // Stop projecting this bill from the anchor month onward.
                    // Set EndDate to the last day of anchorMonth - 1.
                    DateTime lastActiveMonth = new DateTime(anchorYear, anchorMonth, 1, 0, 0, 0, DateTimeKind.Utc)
                        .AddMonths(-1);
                    transaction.EndDate = lastActiveMonth;
                    _transactionRepository.Update(transaction);
                    break;

                case FixedBillScope.FromThisMonthBackward:
                    // Stop projecting this bill for months up to and including the anchor month.
                    // Advance PurchaseDate to the first day of anchorMonth + 1.
                    transaction.PurchaseDate = new DateTime(anchorYear, anchorMonth, 1, 0, 0, 0, DateTimeKind.Utc)
                        .AddMonths(1);
                    _transactionRepository.Update(transaction);
                    break;
            }

            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<bool> UpdateFixedBillAsync(int id, FixedBillUpdateDto updateDto)
        {
            Guid userId = GetCurrentUserId();
            Transaction? original = await _transactionRepository.GetFixedTransactionByIdAsync(id, userId);

            if (original == null) return false;

            if (!DateOnly.TryParseExact(updateDto.AnchorMonth, "yyyy-MM", out DateOnly anchor))
                throw new InvalidOperationException("Invalid anchor month format. Use yyyy-MM.");

            int anchorYear = anchor.Year;
            int anchorMonth = anchor.Month;

            switch (updateDto.Scope)
            {
                case FixedBillScope.All:
                    ApplyFixedBillFields(original, updateDto);
                    _transactionRepository.Update(original);
                    break;

                case FixedBillScope.FromThisMonthForward:
                    // Keep original until anchorMonth - 1, create a new bill from anchorMonth.
                    DateTime originalEndMonth = new DateTime(anchorYear, anchorMonth, 1, 0, 0, 0, DateTimeKind.Utc)
                        .AddMonths(-1);
                    original.EndDate = originalEndMonth;
                    _transactionRepository.Update(original);

                    Transaction forwardBill = CloneFixedBillFrom(original, updateDto, anchorYear, anchorMonth);
                    await _transactionRepository.AddAsync(forwardBill);
                    break;

                case FixedBillScope.FromThisMonthBackward:
                    // Create a new bill covering PurchaseDate to anchorMonth, then advance original to anchorMonth + 1.
                    Transaction backwardBill = CloneFixedBillFrom(original, updateDto, original.PurchaseDate.Year, original.PurchaseDate.Month);
                    backwardBill.EndDate = new DateTime(anchorYear, anchorMonth, 1, 0, 0, 0, DateTimeKind.Utc);
                    await _transactionRepository.AddAsync(backwardBill);

                    original.PurchaseDate = new DateTime(anchorYear, anchorMonth, 1, 0, 0, 0, DateTimeKind.Utc)
                        .AddMonths(1);
                    _transactionRepository.Update(original);
                    break;
            }

            return await _transactionRepository.SaveChangesAsync();
        }

        private static void ApplyFixedBillFields(Transaction transaction, FixedBillUpdateDto updateDto)
        {
            transaction.Description = updateDto.Description;
            transaction.TotalAmount = updateDto.TotalAmount;
            transaction.CategoryId = updateDto.CategoryId;
            transaction.FinancialSourceId = updateDto.FinancialSourceId;
            transaction.DayOfMonth = updateDto.DayOfMonth;
        }

        private static Transaction CloneFixedBillFrom(Transaction source, FixedBillUpdateDto updateDto, int startYear, int startMonth)
        {
            return new Transaction
            {
                Description = updateDto.Description,
                TotalAmount = updateDto.TotalAmount,
                TransactionType = source.TransactionType,
                PurchaseDate = new DateTime(startYear, startMonth, source.DayOfMonth ?? 1, 0, 0, 0, DateTimeKind.Utc),
                IsFixed = true,
                DayOfMonth = updateDto.DayOfMonth,
                IsPaid = false,
                CategoryId = updateDto.CategoryId,
                FinancialSourceId = updateDto.FinancialSourceId,
                UserId = source.UserId,
                CardInstallments = new List<CardInstallment>()
            };
        }

        public async Task<bool> SettleInstallmentsAsync(int transactionId)
        {
            Guid userId = GetCurrentUserId();

            Transaction? transaction = await _transactionRepository.GetByIdWithInstallmentsAsync(transactionId, userId);

            if (transaction == null) return false;
            if (transaction.CardInstallments == null || !transaction.CardInstallments.Any()) return false;

            bool hasUnpaidInstallments = transaction.CardInstallments.Any(i => !i.IsPaid);
            if (!hasUnpaidInstallments) return false;

            foreach (CardInstallment installment in transaction.CardInstallments.Where(i => !i.IsPaid))
                installment.IsPaid = true;

            transaction.IsPaid = true;

            return await _transactionRepository.SaveChangesAsync();
        }

        public async Task<BudgetAnalysisDto> GetBudgetAnalysisAsync(int year, int month)
        {
            IEnumerable<TransactionReadDto> allProjected = await GetAllAsync();

            decimal monthlyIncome = SumByTypeForMonth(allProjected, TransactionType.Income, year, month);

            IEnumerable<TransactionReadDto> monthlyExpenses = allProjected
                .Where(t =>
                    t.TransactionType == TransactionType.Expense &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month);

            decimal needsActual = monthlyExpenses
                .Where(t => t.CategoryBudgetBucket == Piggino.Api.Enum.BudgetBucket.Needs)
                .Sum(t => t.TotalAmount);

            decimal wantsActual = monthlyExpenses
                .Where(t => t.CategoryBudgetBucket == Piggino.Api.Enum.BudgetBucket.Wants)
                .Sum(t => t.TotalAmount);

            decimal savingsActual = monthlyExpenses
                .Where(t => t.CategoryBudgetBucket == Piggino.Api.Enum.BudgetBucket.Savings)
                .Sum(t => t.TotalAmount);

            decimal unclassifiedActual = monthlyExpenses
                .Where(t => t.CategoryBudgetBucket == Piggino.Api.Enum.BudgetBucket.None)
                .Sum(t => t.TotalAmount);

            decimal needsTarget = monthlyIncome * 0.50m;
            decimal wantsTarget = monthlyIncome * 0.30m;
            decimal savingsTarget = monthlyIncome * 0.20m;

            List<BucketCategoryBreakdown> needsCategories = BuildBucketBreakdown(
                monthlyExpenses, Piggino.Api.Enum.BudgetBucket.Needs, monthlyIncome);

            List<BucketCategoryBreakdown> wantsCategories = BuildBucketBreakdown(
                monthlyExpenses, Piggino.Api.Enum.BudgetBucket.Wants, monthlyIncome);

            List<BucketCategoryBreakdown> savingsCategories = BuildBucketBreakdown(
                monthlyExpenses, Piggino.Api.Enum.BudgetBucket.Savings, monthlyIncome);

            List<string> insights = GenerateBudgetInsights(
                monthlyIncome,
                needsActual, needsTarget,
                wantsActual, wantsTarget,
                savingsActual, savingsTarget,
                unclassifiedActual,
                wantsCategories);

            return new BudgetAnalysisDto
            {
                Month = $"{year:D4}-{month:D2}",
                MonthlyIncome = monthlyIncome,
                NeedsTarget = needsTarget,
                WantsTarget = wantsTarget,
                SavingsTarget = savingsTarget,
                NeedsActual = needsActual,
                WantsActual = wantsActual,
                SavingsActual = savingsActual,
                UnclassifiedActual = unclassifiedActual,
                NeedsCategories = needsCategories,
                WantsCategories = wantsCategories,
                SavingsCategories = savingsCategories,
                Insights = insights
            };
        }

        private static List<BucketCategoryBreakdown> BuildBucketBreakdown(
            IEnumerable<TransactionReadDto> expenses,
            Piggino.Api.Enum.BudgetBucket bucket,
            decimal monthlyIncome)
        {
            return expenses
                .Where(t => t.CategoryBudgetBucket == bucket)
                .GroupBy(t => new { t.CategoryName, t.CategoryColor })
                .Select(group => new BucketCategoryBreakdown
                {
                    CategoryName = group.Key.CategoryName ?? "Sem categoria",
                    CategoryColor = group.Key.CategoryColor ?? "#6b7280",
                    Amount = group.Sum(t => t.TotalAmount),
                    Percentage = monthlyIncome > 0
                        ? Math.Round(group.Sum(t => t.TotalAmount) / monthlyIncome * 100, 1)
                        : 0
                })
                .OrderByDescending(c => c.Amount)
                .ToList();
        }

        private static List<string> GenerateBudgetInsights(
            decimal income,
            decimal needsActual, decimal needsTarget,
            decimal wantsActual, decimal wantsTarget,
            decimal savingsActual, decimal savingsTarget,
            decimal unclassifiedActual,
            List<BucketCategoryBreakdown> wantsCategories)
        {
            const string CurrencyFormat = "C2";

            var insights = new List<string>();

            if (income <= 0)
            {
                insights.Add("Sem receitas registradas neste mes para calcular o metodo 50/30/20.");
                return insights;
            }

            decimal needsPercent = Math.Round(needsActual / income * 100, 1);
            decimal wantsPercent = Math.Round(wantsActual / income * 100, 1);
            decimal savingsPercent = Math.Round(savingsActual / income * 100, 1);

            if (needsActual <= needsTarget)
                insights.Add($"Voce esta gastando {needsPercent}% em Necessidades (meta: 50%). Dentro da meta.");
            else
                insights.Add($"Voce esta gastando {needsPercent}% em Necessidades (meta: 50%). Excedendo em {(needsActual - needsTarget).ToString(CurrencyFormat)}.");

            if (wantsActual <= wantsTarget)
                insights.Add($"Voce esta gastando {wantsPercent}% em Desejos (meta: 30%). Dentro da meta.");
            else
                insights.Add($"Voce esta gastando {wantsPercent}% em Desejos (meta: 30%). Excedendo em {(wantsActual - wantsTarget).ToString(CurrencyFormat)}. Para se encaixar no metodo, reduza {(wantsActual - wantsTarget).ToString(CurrencyFormat)} em Desejos.");

            if (savingsActual >= savingsTarget)
                insights.Add($"Voce esta guardando {savingsPercent}% (meta: 20%). Dentro da meta.");
            else
                insights.Add($"Voce esta guardando {savingsPercent}% (meta: 20%). Abaixo da meta em {(savingsTarget - savingsActual).ToString(CurrencyFormat)}.");

            IEnumerable<string> topWantsNames = wantsCategories.Take(2).Select(c => c.CategoryName);
            if (topWantsNames.Any())
                insights.Add($"Suas maiores despesas em Desejos sao: {string.Join(", ", topWantsNames)}.");

            if (unclassifiedActual > 0)
                insights.Add($"{unclassifiedActual.ToString(CurrencyFormat)} ainda nao classificados. Classifique suas categorias para uma analise completa.");

            return insights;
        }

        public async Task<SimulationReadDto> GetSimulationAsync()
        {
            Guid userId = GetCurrentUserId();

            IEnumerable<Transaction> activeTransactions = await _transactionRepository
                .GetActiveInstallmentTransactionsAsync(userId);

            List<SimulationItemDto> items = activeTransactions
                .Select(MapToSimulationItemDto)
                .OrderBy(i => i.NextDueDate)
                .ToList();

            decimal totalRemainingAmount = items.Sum(i => i.RemainingAmount);
            decimal totalMonthlyCommitment = items.Sum(i => i.MonthlyAmount);

            return new SimulationReadDto
            {
                Items = items,
                TotalRemainingAmount = totalRemainingAmount,
                TotalMonthlyCommitment = totalMonthlyCommitment
            };
        }

        private static SimulationItemDto MapToSimulationItemDto(Transaction transaction)
        {
            ICollection<CardInstallment> installments = transaction.CardInstallments!;

            int paidCount = installments.Count(i => i.IsPaid);
            int totalCount = transaction.InstallmentCount ?? installments.Count;
            int remainingCount = totalCount - paidCount;

            decimal monthlyAmount = totalCount > 0
                ? transaction.TotalAmount / totalCount
                : transaction.TotalAmount;

            decimal remainingAmount = monthlyAmount * remainingCount;

            DateTime nextDueDate = installments
                .Where(i => !i.IsPaid)
                .OrderBy(i => i.DueDate)
                .Select(i => i.DueDate)
                .FirstOrDefault();

            return new SimulationItemDto
            {
                TransactionId = transaction.Id,
                Description = transaction.Description ?? string.Empty,
                FinancialSourceName = transaction.FinancialSource?.Name ?? string.Empty,
                TotalAmount = transaction.TotalAmount,
                InstallmentCount = totalCount,
                PaidInstallments = paidCount,
                RemainingInstallments = remainingCount,
                RemainingAmount = remainingAmount,
                MonthlyAmount = monthlyAmount,
                NextDueDate = nextDueDate
            };
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
                FinancialSourceType = transaction.FinancialSource?.Type,
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
                !HasStoredInstallments(t) &&
                (t.FinancialSource == null || t.FinancialSource.Type != FinancialSourceType.Card));
        }

        private static bool HasStoredInstallments(Transaction transaction)
        {
            return transaction.CardInstallments != null && transaction.CardInstallments.Any();
        }

        private static IEnumerable<Transaction> ProjectInstallmentTransactions(IEnumerable<Transaction> transactions)
        {
            var installmentTransactions = transactions.Where(t =>
                !t.IsFixed &&
                HasStoredInstallments(t));

            var projected = new List<Transaction>();

            foreach (var transaction in installmentTransactions)
            {
                foreach (var installment in transaction.CardInstallments!)
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
                OriginalPurchaseDate = source.PurchaseDate,
                IsInstallment = source.IsInstallment,
                IsFixed = false,
                IsRecurring = source.IsRecurring,
                IsPaid = installment.IsPaid,
                CategoryId = source.CategoryId,
                Category = source.Category,
                FinancialSourceId = source.FinancialSourceId,
                FinancialSource = source.FinancialSource,
                UserId = source.UserId,
                InstallmentCount = source.InstallmentCount,
                CurrentInstallmentNumber = installment.InstallmentNumber,
                GoalId = source.GoalId,
                Goal = source.Goal
            };
        }

        private static IEnumerable<Transaction> ProjectFixedTransactions(
            IEnumerable<Transaction> transactions,
            HashSet<(int transactionId, int year, int month)> paidFixedBillKeys)
        {
            List<Transaction> fixedTransactions = transactions
                .Where(t => t.IsFixed && t.DayOfMonth.HasValue)
                .ToList();

            if (!fixedTransactions.Any()) return Enumerable.Empty<Transaction>();

            DateTime windowStart = fixedTransactions.Min(t => t.PurchaseDate);
            DateTime windowEnd = DateTime.UtcNow.AddMonths(FixedTransactionProjectionMonthsForward);

            int totalMonths = MonthsBetween(windowStart, windowEnd) + 1;

            List<Transaction> projected = new List<Transaction>();

            for (int monthOffset = 0; monthOffset < totalMonths; monthOffset++)
            {
                DateTime month = new DateTime(windowStart.Year, windowStart.Month, 1, 0, 0, 0, DateTimeKind.Utc)
                    .AddMonths(monthOffset);

                foreach (Transaction fixedTransaction in fixedTransactions)
                {
                    DateTime projectedDate = GetSafeDayInMonth(month.Year, month.Month, fixedTransaction.DayOfMonth!.Value);

                    if (projectedDate.Date < fixedTransaction.PurchaseDate.Date) continue;

                    if (IsAfterEndDate(fixedTransaction, month.Year, month.Month)) continue;

                    bool isPaid = paidFixedBillKeys.Contains((fixedTransaction.Id, month.Year, month.Month));
                    projected.Add(ProjectFixedTransactionToMonth(fixedTransaction, projectedDate, isPaid));
                }
            }

            return projected;
        }

        private static bool IsFixedBillActiveForMonth(Transaction fixedTransaction, int year, int month)
        {
            bool startsAfterMonth = fixedTransaction.PurchaseDate.Year > year
                || (fixedTransaction.PurchaseDate.Year == year && fixedTransaction.PurchaseDate.Month > month);

            if (startsAfterMonth) return false;

            return !IsAfterEndDate(fixedTransaction, year, month);
        }

        private static bool IsAfterEndDate(Transaction fixedTransaction, int year, int month)
        {
            if (!fixedTransaction.EndDate.HasValue) return false;

            return year > fixedTransaction.EndDate.Value.Year
                || (year == fixedTransaction.EndDate.Value.Year && month > fixedTransaction.EndDate.Value.Month);
        }

        private static int MonthsBetween(DateTime from, DateTime to)
        {
            return (to.Year - from.Year) * 12 + (to.Month - from.Month);
        }

        private static Transaction ProjectFixedTransactionToMonth(Transaction source, DateTime projectedDate, bool isPaid)
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
                IsPaid = isPaid,
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
            if (!isCreditCard)
                return purchaseDate;

            if (!financialSource.ClosingDay.HasValue || !financialSource.DueDay.HasValue)
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

            bool purchaseDateChanged = existing.PurchaseDate.Date != updateDto.PurchaseDate.Date;

            return existing.IsInstallment != updateDto.IsInstallment
                || existing.InstallmentCount != updateDto.InstallmentCount
                || existing.FinancialSourceId != updateDto.FinancialSourceId
                || currentInstallmentAmount != updateDto.TotalAmount
                || purchaseDateChanged;
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
            transaction.GoalId = updateDto.GoalId;
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
                OriginalPurchaseDate = transaction.OriginalPurchaseDate ?? transaction.PurchaseDate,
                IsInstallment = transaction.IsInstallment,
                InstallmentCount = transaction.InstallmentCount,
                CurrentInstallmentNumber = transaction.CurrentInstallmentNumber,
                IsPaid = transaction.IsPaid,
                IsFixed = transaction.IsFixed,
                DayOfMonth = transaction.DayOfMonth,
                IsRecurring = transaction.IsRecurring,
                CategoryId = transaction.CategoryId,
                CategoryName = transaction.Category?.Name,
                CategoryColor = transaction.Category?.Color,
                CategoryBudgetBucket = transaction.Category?.BudgetBucket ?? Piggino.Api.Enum.BudgetBucket.None,
                FinancialSourceId = transaction.FinancialSourceId,
                FinancialSourceName = transaction.FinancialSource?.Name,
                FinancialSourceType = transaction.FinancialSource?.Type,
                UserId = transaction.UserId,
                GoalId = transaction.GoalId,
                GoalName = transaction.Goal?.Name,
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

        // --- Goal contribution ---

        private async Task RecalculateAffectedGoalsAsync(
            Guid userId,
            int? oldGoalId, bool oldIsPaid,
            int? newGoalId, bool newIsPaid)
        {
            bool goalChanged = oldGoalId != newGoalId;

            if (goalChanged)
            {
                if (oldGoalId.HasValue)
                    await ApplyGoalContributionAsync(oldGoalId.Value, userId);

                if (newGoalId.HasValue)
                    await ApplyGoalContributionAsync(newGoalId.Value, userId);

                return;
            }

            bool isPaidChanged = oldIsPaid != newIsPaid;
            if (isPaidChanged && newGoalId.HasValue)
                await ApplyGoalContributionAsync(newGoalId.Value, userId);
        }

        private async Task ApplyGoalContributionAsync(int goalId, Guid userId)
        {
            Goal? goal = await _goalRepository.GetByIdAsync(goalId, userId);
            if (goal == null) return;

            goal.CurrentAmount = await _goalRepository.GetPaidTransactionsSumAsync(goalId);
            goal.IsCompleted = goal.CurrentAmount >= goal.TargetAmount;

            _goalRepository.Update(goal);
            await _goalRepository.SaveChangesAsync();
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
                IsRecurring = createDto.IsRecurring,
                GoalId = createDto.GoalId
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

        // --- Debt Summary ---

        public async Task<DebtSummaryDto> GetDebtSummaryAsync()
        {
            Guid userId = GetCurrentUserId();

            IEnumerable<Transaction> activeTransactions = await _transactionRepository
                .GetActiveInstallmentTransactionsAsync(userId);

            List<DebtItemDto> unsorted = activeTransactions
                .Select(MapToDebtItemDto)
                .ToList();

            List<DebtItemDto> avalancheRanked = unsorted
                .OrderByDescending(d => d.MonthlyPayment)
                .ToList();

            List<DebtItemDto> snowballRanked = unsorted
                .OrderBy(d => d.TotalRemaining)
                .ToList();

            for (int index = 0; index < avalancheRanked.Count; index++)
                avalancheRanked[index].Priority_Avalanche = index + 1;

            for (int index = 0; index < snowballRanked.Count; index++)
                snowballRanked[index].Priority_Snowball = index + 1;

            decimal totalDebt = unsorted.Sum(d => d.TotalRemaining);
            decimal totalMonthlyPayment = unsorted.Sum(d => d.MonthlyPayment);

            int estimatedMonthsToFreedom = totalMonthlyPayment > 0
                ? (int)Math.Ceiling(totalDebt / totalMonthlyPayment)
                : 0;

            return new DebtSummaryDto
            {
                Debts = unsorted,
                TotalDebt = totalDebt,
                TotalMonthlyPayment = totalMonthlyPayment,
                EstimatedMonthsToFreedom = estimatedMonthsToFreedom
            };
        }

        private static DebtItemDto MapToDebtItemDto(Transaction transaction)
        {
            ICollection<CardInstallment> installments = transaction.CardInstallments!;

            int paidCount = installments.Count(i => i.IsPaid);
            int totalCount = transaction.InstallmentCount ?? installments.Count;
            int remainingCount = totalCount - paidCount;

            decimal monthlyPayment = totalCount > 0
                ? transaction.TotalAmount / totalCount
                : transaction.TotalAmount;

            decimal totalRemaining = monthlyPayment * remainingCount;

            DateTime? nextDue = installments
                .Where(i => !i.IsPaid)
                .OrderBy(i => i.DueDate)
                .Select(i => (DateTime?)i.DueDate)
                .FirstOrDefault();

            return new DebtItemDto
            {
                TransactionId = transaction.Id,
                Description = transaction.Description ?? string.Empty,
                FinancialSourceName = transaction.FinancialSource?.Name ?? string.Empty,
                TotalRemaining = totalRemaining,
                MonthlyPayment = monthlyPayment,
                TotalInstallments = totalCount,
                RemainingInstallments = remainingCount,
                NextDueDate = nextDue.HasValue ? nextDue.Value.ToString("yyyy-MM-dd") : null
            };
        }

        // --- Health Score ---

        private const int HealthScoreComponentMaxPoints = 25;

        public async Task<HealthScoreDto> GetHealthScoreAsync()
        {
            Guid userId = GetCurrentUserId();
            IEnumerable<TransactionReadDto> allProjected = await GetAllAsync();

            DateTime now = DateTime.UtcNow;
            int currentYear = now.Year;
            int currentMonth = now.Month;

            decimal income = SumByTypeForMonth(allProjected, TransactionType.Income, currentYear, currentMonth);
            decimal expenses = SumByTypeForMonth(allProjected, TransactionType.Expense, currentYear, currentMonth);

            HealthScoreComponent savingsComponent = ScoreSavingsRate(income, expenses);
            HealthScoreComponent fixedBillsComponent = ScoreFixedBillsControl(allProjected, income, currentYear, currentMonth);
            HealthScoreComponent consistencyComponent = ScoreSpendingConsistency(allProjected, expenses, now);
            HealthScoreComponent goalComponent = await ScoreGoalProgressAsync(userId);

            List<HealthScoreComponent> components = new List<HealthScoreComponent>
            {
                savingsComponent,
                fixedBillsComponent,
                consistencyComponent,
                goalComponent
            };

            int totalScore = components.Sum(c => c.Score);
            string grade = ResolveGrade(totalScore);
            string gradeLabel = ResolveGradeLabel(grade);

            List<string> strengths = BuildStrengthsList(savingsComponent, fixedBillsComponent, consistencyComponent, goalComponent);
            List<string> warnings = BuildWarningsList(savingsComponent, fixedBillsComponent, consistencyComponent, goalComponent);

            return new HealthScoreDto
            {
                Score = totalScore,
                Grade = grade,
                GradeLabel = gradeLabel,
                Components = components,
                Strengths = strengths,
                Warnings = warnings
            };
        }

        private static HealthScoreComponent ScoreSavingsRate(decimal income, decimal expenses)
        {
            if (income <= 0)
            {
                return new HealthScoreComponent
                {
                    Name = "Taxa de Poupanca",
                    Score = 0,
                    MaxScore = HealthScoreComponentMaxPoints,
                    Description = "Sem renda registrada este mes."
                };
            }

            decimal savingsRate = (income - expenses) / income;

            int score = savingsRate switch
            {
                >= 0.20m => 25,
                >= 0.15m => 20,
                >= 0.10m => 15,
                >= 0.05m => 10,
                > 0m     =>  5,
                _        =>  0
            };

            decimal ratePercent = Math.Round(savingsRate * 100, 1);

            return new HealthScoreComponent
            {
                Name = "Taxa de Poupanca",
                Score = score,
                MaxScore = HealthScoreComponentMaxPoints,
                Description = $"Voce poupou {ratePercent}% da sua renda este mes."
            };
        }

        private static HealthScoreComponent ScoreFixedBillsControl(
            IEnumerable<TransactionReadDto> transactions,
            decimal income,
            int year,
            int month)
        {
            if (income <= 0)
            {
                return new HealthScoreComponent
                {
                    Name = "Controle de Contas Fixas",
                    Score = 0,
                    MaxScore = HealthScoreComponentMaxPoints,
                    Description = "Sem renda registrada para calcular."
                };
            }

            decimal fixedExpenses = transactions
                .Where(t =>
                    t.TransactionType == TransactionType.Expense &&
                    t.IsFixed &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month)
                .Sum(t => t.TotalAmount);

            decimal ratio = fixedExpenses / income;

            int score = ratio switch
            {
                < 0.30m => 25,
                < 0.40m => 18,
                < 0.50m => 12,
                < 0.60m =>  6,
                _       =>  0
            };

            decimal ratioPercent = Math.Round(ratio * 100, 1);

            return new HealthScoreComponent
            {
                Name = "Controle de Contas Fixas",
                Score = score,
                MaxScore = HealthScoreComponentMaxPoints,
                Description = $"Suas contas fixas representam {ratioPercent}% da sua renda."
            };
        }

        private static HealthScoreComponent ScoreSpendingConsistency(
            IEnumerable<TransactionReadDto> transactions,
            decimal currentMonthExpenses,
            DateTime now)
        {
            decimal threeMonthTotal = 0m;
            int monthsWithData = 0;

            for (int offset = 1; offset <= 3; offset++)
            {
                DateTime pastMonth = now.AddMonths(-offset);
                decimal monthExpenses = SumByTypeForMonth(transactions, TransactionType.Expense, pastMonth.Year, pastMonth.Month);

                if (monthExpenses <= 0) continue;

                threeMonthTotal += monthExpenses;
                monthsWithData++;
            }

            if (monthsWithData == 0 || threeMonthTotal == 0)
            {
                return new HealthScoreComponent
                {
                    Name = "Consistencia de Gastos",
                    Score = 15,
                    MaxScore = HealthScoreComponentMaxPoints,
                    Description = "Dados insuficientes para comparar. Score neutro aplicado."
                };
            }

            decimal threeMonthAverage = threeMonthTotal / monthsWithData;
            decimal deviation = threeMonthAverage > 0 ? (currentMonthExpenses - threeMonthAverage) / threeMonthAverage : 0;

            int score = deviation switch
            {
                <= 0.10m => 25,
                <= 0.20m => 15,
                <= 0.30m =>  8,
                _        =>  0
            };

            decimal deviationPercent = Math.Round(Math.Abs(deviation) * 100, 1);
            string direction = deviation > 0 ? "acima" : "abaixo";

            return new HealthScoreComponent
            {
                Name = "Consistencia de Gastos",
                Score = score,
                MaxScore = HealthScoreComponentMaxPoints,
                Description = $"Seus gastos estao {deviationPercent}% {direction} da media dos ultimos 3 meses."
            };
        }

        private async Task<HealthScoreComponent> ScoreGoalProgressAsync(Guid userId)
        {
            IEnumerable<Piggino.Api.Domain.Goals.Entities.Goal> allGoals = await _goalRepository.GetAllAsync(userId);
            List<Piggino.Api.Domain.Goals.Entities.Goal> activeGoals = allGoals.Where(g => !g.IsCompleted).ToList();

            if (!activeGoals.Any())
            {
                return new HealthScoreComponent
                {
                    Name = "Progresso de Metas",
                    Score = 15,
                    MaxScore = HealthScoreComponentMaxPoints,
                    Description = "Nenhuma meta ativa. Score neutro aplicado."
                };
            }

            bool hasContributions = activeGoals.Any(g => g.CurrentAmount > 0);

            int score = hasContributions ? 25 : 10;
            string description = hasContributions
                ? $"Voce tem {activeGoals.Count} meta(s) ativa(s) com contribuicoes registradas."
                : $"Voce tem {activeGoals.Count} meta(s) ativa(s) mas ainda nao contribuiu.";

            return new HealthScoreComponent
            {
                Name = "Progresso de Metas",
                Score = score,
                MaxScore = HealthScoreComponentMaxPoints,
                Description = description
            };
        }

        private static string ResolveGrade(int score)
        {
            return score switch
            {
                >= 80 => "A",
                >= 60 => "B",
                >= 40 => "C",
                >= 20 => "D",
                _     => "F"
            };
        }

        private static string ResolveGradeLabel(string grade)
        {
            return grade switch
            {
                "A" => "Excelente",
                "B" => "Bom",
                "C" => "Regular",
                "D" => "Atencao",
                _   => "Critico"
            };
        }

        private static List<string> BuildStrengthsList(params HealthScoreComponent[] components)
        {
            const int StrengthThreshold = 20;
            return components
                .Where(c => c.Score >= StrengthThreshold)
                .Select(c => c.Description)
                .ToList();
        }

        private static List<string> BuildWarningsList(params HealthScoreComponent[] components)
        {
            const int WarningThreshold = 12;
            return components
                .Where(c => c.Score < WarningThreshold)
                .Select(c => c.Description)
                .ToList();
        }

        // --- Contextual Tips ---

        private const int MaxTipsReturned = 10;
        private const decimal HighCategorySpendingThreshold = 0.30m;
        private const decimal HighFixedBillsThreshold = 0.50m;
        private const decimal LowSavingsThreshold = 0.10m;
        private const decimal HighMomSpendingThreshold = 0.20m;

        public async Task<TipsDto> GetContextualTipsAsync()
        {
            Guid userId = GetCurrentUserId();
            IEnumerable<TransactionReadDto> allProjected = await GetAllAsync();

            DateTime now = DateTime.UtcNow;
            int currentYear = now.Year;
            int currentMonth = now.Month;

            decimal income = SumByTypeForMonth(allProjected, TransactionType.Income, currentYear, currentMonth);
            decimal expenses = SumByTypeForMonth(allProjected, TransactionType.Expense, currentYear, currentMonth);

            IEnumerable<TransactionReadDto> monthlyExpenses = allProjected
                .Where(t =>
                    t.TransactionType == TransactionType.Expense &&
                    t.PurchaseDate.Year == currentYear &&
                    t.PurchaseDate.Month == currentMonth);

            IEnumerable<Piggino.Api.Domain.Goals.Entities.Goal> allGoals = await _goalRepository.GetAllAsync(userId);
            IEnumerable<Transaction> activeInstallments = await _transactionRepository.GetActiveInstallmentTransactionsAsync(userId);

            List<ContextualTip> tips = new List<ContextualTip>();

            bool hasTransactionsThisMonth = monthlyExpenses.Any() || income > 0;
            if (!hasTransactionsThisMonth)
            {
                tips.Add(new ContextualTip
                {
                    Title = "Nenhuma transacao registrada",
                    Message = "Voce ainda nao registrou transacoes este mes.",
                    Icon = "📊",
                    Category = "habit",
                    Priority = "high"
                });
                return new TipsDto { Tips = tips };
            }

            AddHighCategorySpendingTip(tips, monthlyExpenses, income);
            AddNoGoalsTip(tips, allGoals);
            AddHighFixedBillsTip(tips, allProjected, income, currentYear, currentMonth);
            AddLowSavingsTip(tips, income, expenses);
            AddHighMomSpendingTip(tips, allProjected, expenses, now);
            AddInstallmentDebtTip(tips, activeInstallments);
            AddPositiveSpendingTrendTip(tips, allProjected, now);

            List<ContextualTip> prioritized = tips
                .OrderBy(t => t.Priority == "high" ? 0 : t.Priority == "medium" ? 1 : 2)
                .Take(MaxTipsReturned)
                .ToList();

            return new TipsDto { Tips = prioritized };
        }

        private static void AddHighCategorySpendingTip(
            List<ContextualTip> tips,
            IEnumerable<TransactionReadDto> monthlyExpenses,
            decimal income)
        {
            if (income <= 0) return;

            var topCategory = monthlyExpenses
                .GroupBy(t => t.CategoryName ?? "Sem categoria")
                .Select(g => new { Name = g.Key, Total = g.Sum(t => t.TotalAmount) })
                .OrderByDescending(c => c.Total)
                .FirstOrDefault();

            if (topCategory == null) return;

            decimal ratio = topCategory.Total / income;
            if (ratio <= HighCategorySpendingThreshold) return;

            decimal percent = Math.Round(ratio * 100, 1);

            tips.Add(new ContextualTip
            {
                Title = "Gasto elevado em categoria",
                Message = $"Sua maior categoria de gasto e {topCategory.Name} com R$ {topCategory.Total:F2} ({percent}% da sua renda).",
                Icon = "⚠️",
                Category = "spending",
                Priority = "high"
            });
        }

        private static void AddNoGoalsTip(
            List<ContextualTip> tips,
            IEnumerable<Piggino.Api.Domain.Goals.Entities.Goal> goals)
        {
            if (goals.Any(g => !g.IsCompleted)) return;

            tips.Add(new ContextualTip
            {
                Title = "Sem metas financeiras",
                Message = "Voce ainda nao tem metas financeiras. Crie uma meta de emergencia hoje.",
                Icon = "🎯",
                Category = "goal",
                Priority = "medium"
            });
        }

        private static void AddHighFixedBillsTip(
            List<ContextualTip> tips,
            IEnumerable<TransactionReadDto> transactions,
            decimal income,
            int year,
            int month)
        {
            if (income <= 0) return;

            decimal fixedExpenses = transactions
                .Where(t =>
                    t.TransactionType == TransactionType.Expense &&
                    t.IsFixed &&
                    t.PurchaseDate.Year == year &&
                    t.PurchaseDate.Month == month)
                .Sum(t => t.TotalAmount);

            decimal ratio = fixedExpenses / income;
            if (ratio <= HighFixedBillsThreshold) return;

            decimal percent = Math.Round(ratio * 100, 1);

            tips.Add(new ContextualTip
            {
                Title = "Contas fixas elevadas",
                Message = $"Suas contas fixas consomem {percent}% da sua renda. Tente reduzir para menos de 50%.",
                Icon = "⚠️",
                Category = "spending",
                Priority = "high"
            });
        }

        private static void AddLowSavingsTip(
            List<ContextualTip> tips,
            decimal income,
            decimal expenses)
        {
            if (income <= 0) return;

            decimal savingsRate = (income - expenses) / income;
            if (savingsRate >= LowSavingsThreshold) return;

            decimal percent = Math.Round(savingsRate * 100, 1);

            tips.Add(new ContextualTip
            {
                Title = "Taxa de poupanca baixa",
                Message = $"Voce poupou apenas {percent}% este mes. Tente aumentar para 20% seguindo o metodo 50/30/20.",
                Icon = "💡",
                Category = "saving",
                Priority = "medium"
            });
        }

        private static void AddHighMomSpendingTip(
            List<ContextualTip> tips,
            IEnumerable<TransactionReadDto> transactions,
            decimal currentExpenses,
            DateTime now)
        {
            DateTime previousMonth = now.AddMonths(-1);
            decimal previousExpenses = SumByTypeForMonth(transactions, TransactionType.Expense, previousMonth.Year, previousMonth.Month);

            if (previousExpenses <= 0) return;

            decimal changeRatio = (currentExpenses - previousExpenses) / previousExpenses;
            if (changeRatio <= HighMomSpendingThreshold) return;

            decimal percent = Math.Round(changeRatio * 100, 1);

            tips.Add(new ContextualTip
            {
                Title = "Gastos em alta",
                Message = $"Seus gastos aumentaram {percent}% em relacao ao mes passado.",
                Icon = "⚠️",
                Category = "spending",
                Priority = "high"
            });
        }

        private static void AddInstallmentDebtTip(
            List<ContextualTip> tips,
            IEnumerable<Transaction> activeInstallments)
        {
            List<Transaction> installmentList = activeInstallments.ToList();
            if (!installmentList.Any()) return;

            decimal totalRemaining = installmentList.Sum(t =>
            {
                int total = t.InstallmentCount ?? t.CardInstallments!.Count;
                int paid = t.CardInstallments!.Count(i => i.IsPaid);
                int remaining = total - paid;
                decimal monthly = total > 0 ? t.TotalAmount / total : t.TotalAmount;
                return monthly * remaining;
            });

            tips.Add(new ContextualTip
            {
                Title = "Parcelas em aberto",
                Message = $"Voce tem {installmentList.Count} compras parceladas em aberto totalizando R$ {totalRemaining:F2}. Considere quitar as de maior valor.",
                Icon = "📊",
                Category = "spending",
                Priority = "medium"
            });
        }

        private static void AddPositiveSpendingTrendTip(
            List<ContextualTip> tips,
            IEnumerable<TransactionReadDto> transactions,
            DateTime now)
        {
            decimal m1 = SumByTypeForMonth(transactions, TransactionType.Expense, now.AddMonths(-1).Year, now.AddMonths(-1).Month);
            decimal m2 = SumByTypeForMonth(transactions, TransactionType.Expense, now.AddMonths(-2).Year, now.AddMonths(-2).Month);
            decimal m3 = SumByTypeForMonth(transactions, TransactionType.Expense, now.AddMonths(-3).Year, now.AddMonths(-3).Month);

            bool isDecreasingTrend = m3 > 0 && m2 > 0 && m1 > 0 && m3 > m2 && m2 > m1;
            if (!isDecreasingTrend) return;

            tips.Add(new ContextualTip
            {
                Title = "Tendencia positiva",
                Message = "Parabens! Seus gastos tem diminuido nos ultimos 3 meses. Continue assim!",
                Icon = "✅",
                Category = "habit",
                Priority = "low"
            });
        }
    }
}
