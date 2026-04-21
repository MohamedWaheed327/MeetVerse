using Microsoft.AspNetCore.Mvc;
using MeetVerse.Api.Services;
using MeetVerse.Api.Services.Background;
using Livekit.Server.Sdk.Dotnet;
using Microsoft.Data.SqlClient;

namespace MeetVerse.Api.Services;

public class CustomLogger
{
    const string ConnectionString = "Server=meetversedb.csfgc24ignv3.us-east-1.rds.amazonaws.com,1433;Database=MeetVerseDb;User Id=admin;Password=^2^532Mxn4!%&3%B;TrustServerCertificate=True;Encrypt=True;";

    public CustomLogger()
    {
    }

    public static void Log(string message)
    {
        using var connection = new SqlConnection(ConnectionString);
        connection.Open();

        string sql = "INSERT INTO logs (message, sent_at) VALUES (@message, @sent_at)";

        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@message", message);
        command.Parameters.AddWithValue("@sent_at", DateTime.UtcNow);

        command.ExecuteNonQuery();
    }
}


