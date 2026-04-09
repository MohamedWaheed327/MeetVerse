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
        var connectionString = "Server=localhost\\SQLEXPRESS;Database=MeetVerseDb;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;MultipleActiveResultSets=true";

        optionsBuilder.UseSqlServer(connectionString);

        return new MeetVerseDbContext(optionsBuilder.Options);
    }
}
