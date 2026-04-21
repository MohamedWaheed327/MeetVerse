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
        var connectionString = "Server=meetversedb.csfgc24ignv3.us-east-1.rds.amazonaws.com,1433;Database=MeetVerseDbFactory;User Id=admin;Password=^2^532Mxn4!%&3%B;TrustServerCertificate=True;Encrypt=True;";

        optionsBuilder.UseSqlServer(connectionString);

        return new MeetVerseDbContext(optionsBuilder.Options);
    }
}
