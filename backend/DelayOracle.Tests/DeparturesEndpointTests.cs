using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using DelayOracle.Api.Models;

namespace DelayOracle.Tests;

// The fake ZTM answers with Fixtures/ztm-departures.json:
// two REALTIME departures (routes 154 and 186) and one SCHEDULED departure (route 208).
public class DeparturesEndpointTests : IDisposable
{
    private const string Url = "/api/stops/1016/departures";

    private readonly ApiFactory _factory = new();

    public void Dispose()
    {
        _factory.Dispose();
    }

    [Fact]
    public async Task RealtimeDeparture_UsesZtmDelayAndIsMarkedFallback()
    {
        var departures = await GetDeparturesAsync();

        var expected = new DepartureResponse(
            Route: "154",
            Headsign: "Jana z Kolna",
            ScheduledTime: Utc(17, 21, 0),
            EstimatedTime: Utc(17, 24, 25),
            CurrentDelaySeconds: 205,
            PredictedDelaySeconds: 205,
            PredictedTime: Utc(17, 24, 25),
            Source: "fallback");
        Assert.Equal(expected, departures[0]);
    }

    [Fact]
    public async Task ScheduledDeparture_HasNoDelaysAndIsMarkedSchedule()
    {
        var departures = await GetDeparturesAsync();

        var expected = new DepartureResponse(
            Route: "208",
            Headsign: "Muzeum II Wojny",
            ScheduledTime: Utc(17, 40, 0),
            EstimatedTime: Utc(17, 40, 0),
            CurrentDelaySeconds: null,
            PredictedDelaySeconds: null,
            PredictedTime: Utc(17, 40, 0),
            Source: "schedule");
        Assert.Equal(expected, departures[2]);
    }

    [Fact]
    public async Task Departures_AreSortedByPredictedTime()
    {
        _factory.ZtmHandler = FakeHttpHandler.Returning(DeparturesFixtureInReverseOrder());

        var departures = await GetDeparturesAsync();

        Assert.Equal(["154", "186", "208"], departures.Select(departure => departure.Route));
    }

    [Fact]
    public async Task Json_UsesCamelCaseAndUtcTimes()
    {
        var json = await _factory.CreateClient().GetStringAsync(Url);

        Assert.Contains("\"predictedDelaySeconds\":205", json);
        Assert.Contains("\"scheduledTime\":\"2026-11-14T17:21:00Z\"", json);
    }

    [Fact]
    public async Task UnknownStop_ReturnsEmptyList()
    {
        // ZTM answers 200 with an empty body for a stop id it does not know.
        _factory.ZtmHandler = FakeHttpHandler.Returning("");

        var departures = await GetDeparturesAsync();

        Assert.Empty(departures);
    }

    [Fact]
    public async Task WhenZtmIsDown_Returns503ProblemDetails()
    {
        _factory.ZtmHandler = FakeHttpHandler.Returning("down", HttpStatusCode.InternalServerError);

        var response = await _factory.CreateClient().GetAsync(Url);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    private async Task<List<DepartureResponse>> GetDeparturesAsync()
    {
        return (await _factory.CreateClient().GetFromJsonAsync<List<DepartureResponse>>(Url))!;
    }

    private static string DeparturesFixtureInReverseOrder()
    {
        var root = JsonNode.Parse(FakeHttpHandler.Fixture("ztm-departures.json"))!;
        var reversed = root["departures"]!.AsArray().Reverse().Select(node => node!.DeepClone()).ToArray();
        root["departures"] = new JsonArray(reversed);
        return root.ToJsonString();
    }

    private static DateTime Utc(int hour, int minute, int second)
    {
        return new DateTime(2026, 11, 14, hour, minute, second, DateTimeKind.Utc);
    }
}
