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
        var connectionString = "Server=tcp:meetverse-server2.database.windows.net,1433;Initial Catalog=MeetVerseDBFactory;Persist Security Info=False;User ID=admin1;Password=WRF09QWEC^a4yTxU;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";

        optionsBuilder.UseSqlServer(connectionString);

        return new MeetVerseDbContext(optionsBuilder.Options);
    }
}
