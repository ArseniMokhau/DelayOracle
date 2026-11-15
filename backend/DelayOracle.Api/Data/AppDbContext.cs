using DelayOracle.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DelayOracle.Api.Data;

// The EF Core view of the SQLite database: one table, Commutes.
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Commute> Commutes => Set<Commute>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // SQLite stores a DateTime without its kind, so it would come back as "unspecified" and
        // be serialised without the Z suffix. The stored value is UTC; mark it as such when reading.
        modelBuilder.Entity<Commute>()
                    .Property(commute => commute.CreatedAt)
                    .HasConversion(value => value, value => DateTime
                    .SpecifyKind(value, DateTimeKind.Utc));
    }
}



