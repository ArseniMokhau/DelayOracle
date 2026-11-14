using System.Net;
using DelayOracle.Api.Data;
using DelayOracle.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DelayOracle.Tests;

// Starts the real API in memory, but with a throwaway SQLite database instead of app.db
// and a fake ZTM instead of the network.
public class ApiFactory : WebApplicationFactory<Program>
{
    // An in-memory SQLite database lives only while its connection is open.
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    // What "ZTM" answers. Replace it before the first request to simulate a failure.
    public FakeHttpHandler ZtmHandler { get; set; } = new(AnswerFromFixtures);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));

            services.AddHttpClient<ZtmClient>().ConfigurePrimaryHttpMessageHandler(() => ZtmHandler);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _connection.Dispose();
    }

    private static HttpResponseMessage AnswerFromFixtures(HttpRequestMessage request)
    {
        var isStopsRequest = request.RequestUri!.AbsolutePath.EndsWith("stops.json");
        var fixture = isStopsRequest ? "ztm-stops.json" : "ztm-departures.json";
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(FakeHttpHandler.Fixture(fixture)),
        };
    }
}
