using Microsoft.EntityFrameworkCore;
using Piggino.Api.Domain.Bot.Entities;
using Piggino.Api.Domain.Budgets.Entities;
using Piggino.Api.Domain.CardInstallments.Entities;
using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.Goals.Entities;
using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Users.Entities;

namespace Piggino.Api.Data
{
    public class PigginoDbContext : DbContext
    {
        public PigginoDbContext(DbContextOptions<PigginoDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<FinancialSource> FinancialSources { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<Transaction> Transactions { get; set; } = null!;
        public DbSet<CardInstallment> CardInstallments { get; set; } = null!;
        public DbSet<FixedTransactionPayment> FixedTransactionPayments { get; set; } = null!;
        public DbSet<Goal> Goals { get; set; } = null!;
        public DbSet<Budget> Budgets { get; set; } = null!;
        public DbSet<BudgetExpense> BudgetExpenses { get; set; } = null!;
        public DbSet<UserTelegramConnection> TelegramConnections { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Category)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.FinancialSource)
                .WithMany(fs => fs.Transactions)
                .HasForeignKey(t => t.FinancialSourceId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.TransactionType)
                .HasConversion<string>();

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Goal)
                .WithMany()
                .HasForeignKey(t => t.GoalId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder
                .Entity<Transaction>()
                .Ignore(t => t.CurrentInstallmentNumber);

            modelBuilder
                .Entity<Transaction>()
                .Ignore(t => t.OriginalPurchaseDate);

            modelBuilder.Entity<FixedTransactionPayment>()
                .HasOne(p => p.Transaction)
                .WithMany()
                .HasForeignKey(p => p.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FixedTransactionPayment>()
                .HasIndex(p => new { p.TransactionId, p.Year, p.Month })
                .IsUnique();

            modelBuilder
                .Entity<Category>()
                .Property(c => c.Type)
                .HasConversion<string>();

            modelBuilder
                .Entity<Category>()
                .Property(c => c.BudgetBucket)
                .HasConversion<string>();

            modelBuilder
                .Entity<FinancialSource>()
                .Property(f => f.Type)
                .HasConversion<string>();

            modelBuilder
                .Entity<Goal>()
                .Property(g => g.Type)
                .HasConversion<string>();

            modelBuilder.Entity<UserTelegramConnection>()
                .HasOne<User>()
                .WithMany(u => u.TelegramConnections)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserTelegramConnection>()
                .HasIndex(c => c.ChatId)
                .IsUnique();

            modelBuilder.Entity<Budget>()
                .HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BudgetExpense>()
                .HasOne(e => e.Budget)
                .WithMany(b => b.Expenses)
                .HasForeignKey(e => e.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
