using Microsoft.EntityFrameworkCore;
using Piggino.Api.Domain.CardInstallments.Entities;
using Piggino.Api.Domain.Categories.Entities;
using Piggino.Api.Domain.FinancialSources.Entities;
using Piggino.Api.Domain.Transactions.Entities;
using Piggino.Api.Domain.Users.Entities;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace Piggino.Api.Data
{
    public class PigginoDbContext : DbContext
    {
        public PigginoDbContext(DbContextOptions<PigginoDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<FinancialSource> FinancialSources { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<CardInstallment> CardInstallments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.TransactionType)
                .HasConversion<string>();

            modelBuilder
                .Entity<Category>()
                .Property(c => c.Type)
                .HasConversion<string>();

            modelBuilder
                .Entity<FinancialSource>()
                .Property(f => f.Type)
                .HasConversion<string>();
        }
    }
}
