using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MeetVerse.Api.Database;

public class MeetVerseDbContextFactory : IDesignTimeDbContextFactory<MeetVerseDbContext>
{
    public MeetVerseDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<MeetVerseDbContext>();

        // This connection string is strictly for EF Core design-time tools (migrations).
        // It does not override appsettings.json at runtime.
        var connectionString = "Server=meetverse-database.csr4uc44qxg8.us-east-1.rds.amazonaws.com,1433;Database=MeetVerseDbFactory;User Id=admin;Password=pWKX8mOOt5cjTHpH3OmW;Encrypt=True;TrustServerCertificate=True;";

        optionsBuilder.UseSqlServer(connectionString);

        return new MeetVerseDbContext(optionsBuilder.Options);
    }
}
