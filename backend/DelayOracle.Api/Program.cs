using DelayOracle.Api.Controllers;
using DelayOracle.Api.Data;
using DelayOracle.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

const string CorsPolicy = "Frontend";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ZtmUnavailableExceptionHandler>();
builder.Services.AddMemoryCache();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<CommuteService>();
builder.Services.AddScoped<StopService>();
builder.Services.AddScoped<DepartureService>();

builder.Services.Configure<ZtmOptions>(builder.Configuration.GetSection("Ztm"));
builder.Services.AddHttpClient<ZtmClient>((services, client) =>
{
    var options = services.GetRequiredService<IOptions<ZtmOptions>>().Value;
    client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
});

// The browser only lets the frontend call this API if its origin is on this list.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddPolicy(CorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Create or update the database tables on startup, so a fresh clone or container just works.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

// Unhandled exceptions become a 500 ProblemDetails response without a stack trace.
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "DelayOracle API"));
}

app.UseCors(CorsPolicy);
app.MapControllers();

app.Run();
