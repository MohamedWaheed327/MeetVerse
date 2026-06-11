using MeetVerse.Domain.Contracts;
using MeetVerse.Presentation.Hubs;
using MeetVerse.Web.Extensions;
using MeetVerse.Web.Middleware;
using Microsoft.OpenApi;
using Microsoft.EntityFrameworkCore;

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

    // Resiliency: Use fully qualified names to prevent schema naming collisions
    options.CustomSchemaIds(type => type.FullName);

    // Resiliency: Gracefully handle duplicate routes by picking the first one
    options.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());

    // Resiliency: Safely load XML documentation if it exists
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (System.IO.File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Register all application services via extension methods
builder.Services.AddHttpContextAccessor();
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddIdentityServices(builder.Configuration);
builder.Services.AddCorsServices(builder.Configuration, builder.Environment);

builder.Services.AddSignalR();
builder.Services.AddControllers()
    .AddApplicationPart(typeof(MeetVerse.Presentation.Controllers.AuthController).Assembly);

var app = builder.Build();

// Seed and migrate database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MeetVerse.Persistence.Data.MeetVerseDbContext>();
    await dbContext.Database.MigrateAsync();

    var seeder = scope.ServiceProvider.GetRequiredService<IDatabaseSeeder>();
    await seeder.SeedAsync();
}

// Middleware pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment() || true)
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.Context.Request.Path.StartsWithSegments("/avatars"))
        {
            ctx.Context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
            ctx.Context.Response.Headers.Pragma = "no-cache";
            ctx.Context.Response.Headers.Expires = "0";
        }
    }
});
app.UseWebSockets();
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
