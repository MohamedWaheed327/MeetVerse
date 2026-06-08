using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Domain.Contracts;
using MeetVerse.Persistence.Data;
using MeetVerse.Persistence.Seeds;
using MeetVerse.Services.Implementations.Auth;
using MeetVerse.Services.Implementations.Audio;
using MeetVerse.Services.Implementations.Background;
using MeetVerse.Services.Implementations.LiveKit;
using MeetVerse.Services.Implementations.Whiteboard;
using MeetVerse.Shared.Configuration;

namespace MeetVerse.Web.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<MeetVerseDbContext>(options => options.UseSqlServer(connectionString));

        // Configuration
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.Configure<MiroSettings>(configuration.GetSection("Miro"));

        // Services
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<ILiveKitTokenService, LiveKitTokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IDatabaseSeeder, DatabaseSeeder>();
        services.AddScoped<IAudioFilterService, StubAudioFilterService>();
        services.AddScoped<IAudioTranscriptionService, StubAudioTranscriptionService>();
        services.AddScoped<IAudioSummarizationService, StubAudioSummarizationService>();

        // Background Services
        services.AddHostedService<MeetingProcessingWorker>();

        // HTTP Clients
        services.AddHttpClient();
        services.AddHttpClient<IMiroWhiteboardService, MiroWhiteboardService>();

        return services;
    }
}
