using Microsoft.AspNetCore.Mvc;
using MeetVerse.Api.Services;
using MeetVerse.Api.Services.Background;
using Livekit.Server.Sdk.Dotnet;
using Microsoft.Data.SqlClient;

namespace MeetVerse.Api.Services;

public class CustomLogger
{
    const string ConnectionString = "Server=tcp:meetverse-server2.database.windows.net,1433;Initial Catalog=MeetVerseDB;Persist Security Info=False;User ID=admin1;Password=WRF09QWEC^a4yTxU;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";

    public CustomLogger()
    {
    }

    public static void Log(string message)
    {
        using var connection = new SqlConnection(ConnectionString);
        connection.Open();

        // string sql = "INSERT INTO logs (message, sent_at) VALUES (@message, @sent_at)";

        // using var command = new SqlCommand(sql, connection);
        // command.Parameters.AddWithValue("@message", message);
        // command.Parameters.AddWithValue("@sent_at", DateTime.UtcNow);

        // command.ExecuteNonQuery();
    }
}


