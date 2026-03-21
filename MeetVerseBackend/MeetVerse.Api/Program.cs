using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MeetVerse.Api.Configuration;
using MeetVerse.Api.Data;
using MeetVerse.Api.Hubs;
using MeetVerse.Api.Services;
using MeetVerse.Api.Models;
using MeetVerse.Api.Services.Background;
using Microsoft.OpenApi;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
// Source - https://stackoverflow.com/a/79835686
// Posted by Nermin, modified by community. See post 'Timeline' for change history
// Retrieved 2026-03-13, License - CC BY-SA 4.0
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("bearer", document)] = []
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<MeetVerseDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

builder.Services.AddSignalR();
builder.Services.AddControllers();

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

var jwtSection = builder.Configuration.GetSection("Jwt");
var ProductionSection = builder.Configuration.GetSection("Production");
var DevelopmentSection = builder.Configuration.GetSection("Development");
var keyBytes = Encoding.UTF8.GetBytes(jwtSection["Key"] ?? "DEVELOPMENT_SECRET_CHANGE_ME");
var signingKey = new SymmetricSecurityKey(keyBytes);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"].FirstOrDefault();
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && (path.StartsWithSegments("/hubs/chat") || path.StartsWithSegments("/hubs/whiteboard") || path.StartsWithSegments("/hubs/groupchat") || path.StartsWithSegments("/hubs/meetingchat")))
                    ctx.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            string devFrontend = DevelopmentSection["Frontend"]!;
            string prodFrontend = ProductionSection["Frontend"]!;

            var frontendHost = builder.Environment.IsDevelopment() ? devFrontend : prodFrontend;

            policy.WithOrigins(frontendHost)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IDatabaseSeeder, DatabaseSeeder>();
builder.Services.AddScoped<IAudioFilterService, StubAudioFilterService>();
builder.Services.AddScoped<IAudioTranscriptionService, StubAudioTranscriptionService>();
builder.Services.AddScoped<IAudioSummarizationService, StubAudioSummarizationService>();
builder.Services.AddHostedService<MeetingProcessingWorker>();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<IDatabaseSeeder>();
    await seeder.SeedAsync();
}

if (app.Environment.IsDevelopment() || true)
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MeetingChatHub>("/hubs/chat");
app.MapHub<WhiteboardHub>("/hubs/whiteboard");
app.MapHub<GroupChatHub>("/hubs/groupchat");
app.MapHub<MeetingChatHub>("/hubs/meetingchat");

app.MapGet("/", context =>
{
    context.Response.Redirect("/swagger");
    return Task.CompletedTask;
});

app.Run();
