using DelayOracle.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DelayOracle.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Commute> Commutes => Set<Commute>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Commute>()
                    .Property(commute => commute.CreatedAt)
                    .HasConversion(value => value, value => DateTime
                    .SpecifyKind(value, DateTimeKind.Utc));
    }
}



