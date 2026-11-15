using System.Net;
using DelayOracle.Api.Services;
using Microsoft.Extensions.Options;

namespace DelayOracle.Tests;

// The fixtures are trimmed copies of real ZTM Gdańsk responses (CC BY).
public class ZtmClientTests
{
    private static readonly ZtmOptions ZtmOptions = new()
    {
        DeparturesUrl = "https://ztm.test/departures",
        StopsUrl = "https://ztm.test/stops.json",
    };

    [Fact]
    public async Task GetDepartures_ParsesRealtimeDeparture()
    {
        var client = CreateClient(FakeHttpHandler.Returning(FakeHttpHandler.Fixture("ztm-departures.json")));

        var departures = await client.GetDeparturesAsync(1016, CancellationToken.None);

        Assert.Equal(3, departures.Count);
        var first = departures[0];
        Assert.Equal("154", first.RouteShortName);
        Assert.Equal("Jana z Kolna", first.Headsign);
        Assert.Equal(Utc(17, 21, 0), first.TheoreticalTime);
        Assert.Equal(Utc(17, 24, 25), first.EstimatedTime);
        Assert.Equal(205, first.DelayInSeconds);
        Assert.Equal("REALTIME", first.Status);
    }

    [Fact]
    public async Task GetDepartures_ScheduledDepartureHasNoDelay()
    {
        var client = CreateClient(FakeHttpHandler.Returning(FakeHttpHandler.Fixture("ztm-departures.json")));

        var departures = await client.GetDeparturesAsync(1016, CancellationToken.None);

        var scheduled = departures[2];
        Assert.Equal("SCHEDULED", scheduled.Status);
        Assert.Null(scheduled.DelayInSeconds);
    }

    [Fact]
    public async Task GetDepartures_AsksZtmForTheGivenStop()
    {
        var handler = FakeHttpHandler.Returning(FakeHttpHandler.Fixture("ztm-departures.json"));
        var client = CreateClient(handler);

        await client.GetDeparturesAsync(1016, CancellationToken.None);

        Assert.Equal(["https://ztm.test/departures?stopId=1016"], handler.RequestedUrls);
    }

    [Fact]
    public async Task GetDepartures_EmptyBody_ReturnsEmptyList()
    {
        // ZTM answers 200 with an empty body for a stop id it does not know.
        var client = CreateClient(FakeHttpHandler.Returning(""));

        var departures = await client.GetDeparturesAsync(99999999, CancellationToken.None);

        Assert.Empty(departures);
    }

    [Fact]
    public async Task GetStops_ReturnsTheStopsOfEveryDay()
    {
        var handler = FakeHttpHandler.Returning(FakeHttpHandler.Fixture("ztm-stops.json"));
        var client = CreateClient(handler);

        var stops = await client.GetStopsAsync(CancellationToken.None);

        Assert.Equal(10, stops.Count);
        var first = stops[0];
        Assert.Equal(1028, first.StopId);
        Assert.Equal("Brama Wyżynna", first.StopName);
        Assert.Equal("05", first.StopCode);
        Assert.Equal("Gdańsk", first.ZoneName);
        Assert.Equal(["https://ztm.test/stops.json"], handler.RequestedUrls);
    }

    [Fact]
    public async Task GetStops_KeepsStopsWithoutAName()
    {
        var client = CreateClient(FakeHttpHandler.Returning(FakeHttpHandler.Fixture("ztm-stops.json")));

        var stops = await client.GetStopsAsync(CancellationToken.None);

        Assert.Contains(stops, stop => stop.StopName == null);
    }

    public static TheoryData<FakeHttpHandler> FailingHandlers => new()
    {
        FakeHttpHandler.Returning("server error", HttpStatusCode.InternalServerError),
        FakeHttpHandler.Returning("this is not JSON"),
        FakeHttpHandler.Throwing(new HttpRequestException("connection refused")),
        FakeHttpHandler.Throwing(new TaskCanceledException("the request timed out")),
    };

    [Theory]
    [MemberData(nameof(FailingHandlers))]
    public async Task GetDepartures_WhenZtmFails_ThrowsZtmUnavailable(FakeHttpHandler handler)
    {
        var client = CreateClient(handler);

        await Assert.ThrowsAsync<ZtmUnavailableException>(
            () => client.GetDeparturesAsync(1016, CancellationToken.None));
    }

    [Theory]
    [MemberData(nameof(FailingHandlers))]
    public async Task GetStops_WhenZtmFails_ThrowsZtmUnavailable(FakeHttpHandler handler)
    {
        var client = CreateClient(handler);

        await Assert.ThrowsAsync<ZtmUnavailableException>(
            () => client.GetStopsAsync(CancellationToken.None));
    }

    private static ZtmClient CreateClient(FakeHttpHandler handler)
    {
        return new ZtmClient(new HttpClient(handler), Options.Create(ZtmOptions));
    }

    private static DateTime Utc(int hour, int minute, int second)
    {
        return new DateTime(2026, 11, 14, hour, minute, second, DateTimeKind.Utc);
    }
}
