namespace MeetVerse.Web.Extensions;

public static class CorsServiceExtensions
{
    public static IServiceCollection AddCorsServices(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        var devFrontend = configuration["Development:Frontend"]!;
        var prodFrontend = configuration["Production:Frontend"]!;

        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                var frontendHost = environment.IsDevelopment() ? devFrontend : prodFrontend;
                policy.WithOrigins(frontendHost)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });

        return services;
    }
}
