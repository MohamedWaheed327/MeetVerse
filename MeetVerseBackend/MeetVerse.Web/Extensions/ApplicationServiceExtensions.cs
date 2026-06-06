using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Domain.Contracts;
using MeetVerse.Persistence.Data;
using MeetVerse.Persistence.Seeds;
using MeetVerse.Services.Implementations.Auth;
using MeetVerse.Services.Implementations.Audio;
using MeetVerse.Services.Implementations.Background;
using MeetVerse.Services.Implementations.LiveKit;
using MeetVerse.Services.Implementations.Whiteboard;
using MeetVerse.Services.Implementations.Profile;
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
        services.Configure<LiveKitSettings>(configuration.GetSection("LiveKit"));

        services.AddAutoMapper(typeof(MeetVerse.Abstraction.Mapping.ProfileMappingProfile).Assembly);

        // MediatR
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(typeof(MeetVerse.Abstraction.Commands.UploadAvatarCommand).Assembly);
            cfg.RegisterServicesFromAssembly(typeof(LocalImageStorageService).Assembly);
        });

        // Services
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<ILiveKitTokenService, LiveKitTokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IDatabaseSeeder, DatabaseSeeder>();
        services.AddScoped<IAudioFilterService, StubAudioFilterService>();
        services.AddScoped<IAudioTranscriptionService, StubAudioTranscriptionService>();
        services.AddScoped<IAudioSummarizationService, StubAudioSummarizationService>();
        services.AddScoped<IImageStorageService, LocalImageStorageService>();
        services.AddScoped<IImageResolver, ImageResolver>();

        // Background Services
        services.AddHostedService<MeetingProcessingWorker>();

        // HTTP Clients
        services.AddHttpClient();
        services.AddHttpClient<IMiroWhiteboardService, MiroWhiteboardService>();

        return services;
    }
}
