using System.Text.Json;
using DelayOracle.Api.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace DelayOracle.Tests;

public class StopServiceTests
{
    [Fact]
    public async Task Search_ReturnsAtMost20Stops()
    {
        var service = CreateService(FakeHttpHandler.Returning(StopsJson(count: 30, name: "Testowa")));

        var stops = await service.SearchAsync("testowa", CancellationToken.None);

        Assert.Equal(20, stops.Count);
    }

    [Fact]
    public async Task Search_LoadsTheStopListFromZtmOnlyOnce()
    {
        var handler = FakeHttpHandler.Returning(StopsJson(count: 3, name: "Testowa"));
        var service = CreateService(handler);

        await service.SearchAsync("testowa", CancellationToken.None);
        await service.SearchAsync("inna", CancellationToken.None);

        Assert.Single(handler.RequestedUrls);
    }

    private static StopService CreateService(FakeHttpHandler handler)
    {
        var ztmOptions = Options.Create(new ZtmOptions { StopsUrl = "https://ztm.test/stops.json" });
        var ztmClient = new ZtmClient(new HttpClient(handler), ztmOptions);
        return new StopService(ztmClient, new MemoryCache(new MemoryCacheOptions()));
    }

    // Synthetic data, only for these tests: one day with `count` stops that share a name.
    private static string StopsJson(int count, string name)
    {
        var stops = Enumerable.Range(1, count).Select(number => new
        {
            stopId = number,
            stopName = name,
            stopCode = number.ToString("00"),
            zoneName = "Gdańsk",
        });
        return JsonSerializer.Serialize(new Dictionary<string, object>
        {
            ["2026-11-14"] = new { stops },
        });
    }
}
