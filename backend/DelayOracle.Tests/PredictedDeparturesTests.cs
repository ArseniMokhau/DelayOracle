using System.Net.Http.Json;
using System.Text.Json.Nodes;
using DelayOracle.Api.Models;

namespace DelayOracle.Tests;

// The fake ZTM answers with Fixtures/ztm-departures.json:
// route 154 (scheduled 17:21:00, 205 s late), route 186 (scheduled 17:21:00, 206 s late)
// and route 208 (scheduled 17:40:00, no live data).
public class PredictedDeparturesTests : IDisposable
{
    private const string DeparturesUrl = "/api/stops/1016/departures";

    private readonly ApiFactory _factory = new();

    public void Dispose()
    {
        _factory.Dispose();
    }

    [Fact]
    public async Task LiveDeparture_UsesTheWorkerPredictionAndIsMarkedModel()
    {
        _factory.WorkerHandler = FakeWorker.Predicting(delay => delay + 60);

        var departures = await GetDeparturesAsync();

        var expected = new DepartureResponse(
            Route: "154",
            Headsign: "Jana z Kolna",
            ScheduledTime: Utc(17, 21, 0),
            EstimatedTime: Utc(17, 24, 25),
            CurrentDelaySeconds: 205,
            PredictedDelaySeconds: 265,
            PredictedTime: Utc(17, 25, 25),
            Source: "model");
        Assert.Equal(expected, departures[0]);
    }

    [Fact]
    public async Task ScheduledDeparture_StaysMarkedScheduleAndIsNotSentToTheWorker()
    {
        var sentToWorker = new List<JsonNode>();
        _factory.WorkerHandler = FakeWorker.Predicting(delay => delay + 60, sentToWorker);

        var departures = await GetDeparturesAsync();

        var scheduled = Assert.Single(departures, departure => departure.Route == "208");
        Assert.Equal("schedule", scheduled.Source);
        Assert.Null(scheduled.PredictedDelaySeconds);
        Assert.Equal(Utc(17, 40, 0), scheduled.PredictedTime);

        var request = Assert.Single(sentToWorker);
        Assert.Equal(2, request["departures"]!.AsArray().Count);
    }

    [Fact]
    public async Task Worker_IsToldTheCurrentTime()
    {
        var sentToWorker = new List<JsonNode>();
        _factory.Now = Utc(17, 15, 0);
        _factory.WorkerHandler = FakeWorker.Predicting(delay => delay, sentToWorker);

        await GetDeparturesAsync();

        Assert.Equal("2026-11-14T17:15:00Z", (string?)Assert.Single(sentToWorker)["observed_at"]);
    }

    [Fact]
    public async Task Departures_AreSortedByThePredictedTimeOfTheModel()
    {
        // Route 154 is predicted to leave 10 minutes later than ZTM says, so it moves behind route 186.
        _factory.WorkerHandler = FakeWorker.Predicting(delay => delay == 205 ? 805 : delay);

        var departures = await GetDeparturesAsync();

        Assert.Equal(["186", "154", "208"], departures.Select(departure => departure.Route));
    }

    [Fact]
    public async Task WhenTheWorkerIsDown_DeparturesFallBackToTheZtmDelay()
    {
        _factory.WorkerHandler = FakeWorker.Down();

        var departures = await GetDeparturesAsync();

        Assert.Equal(["fallback", "fallback", "schedule"], departures.Select(departure => departure.Source));
        Assert.Equal(205, departures[0].PredictedDelaySeconds);
        Assert.Equal(Utc(17, 24, 25), departures[0].PredictedTime);
    }

    [Fact]
    public async Task WhenTheWorkerAnswerIsUnusable_DeparturesFallBackToTheZtmDelay()
    {
        // One prediction for two departures.
        _factory.WorkerHandler = FakeHttpHandler.Returning("""{"predicted_delays_s":[1]}""");

        var departures = await GetDeparturesAsync();

        Assert.Equal(["fallback", "fallback", "schedule"], departures.Select(departure => departure.Source));
    }

    [Fact]
    public async Task Advice_UsesThePredictedTimeOfTheModel()
    {
        _factory.Now = Utc(17, 15, 0);
        _factory.WorkerHandler = FakeWorker.Predicting(delay => delay + 60);
        var client = _factory.CreateClient();
        var created = await client.PostAsJsonAsync(
            "/api/commutes", new CommuteRequest("Home to work", 1016, "154", 5));
        var commute = (await created.Content.ReadFromJsonAsync<CommuteResponse>())!;

        var advice = await client.GetFromJsonAsync<AdviceResponse>($"/api/commutes/{commute.Id}/advice");

        // Predicted departure 17:25:25, minus a 5 minute walk and 1 minute of margin.
        Assert.Equal("model", advice!.Departure?.Source);
        Assert.Equal(Utc(17, 19, 25), advice.LeaveBy);
        Assert.Equal(4, advice.LeaveInMinutes);
    }

    private async Task<List<DepartureResponse>> GetDeparturesAsync()
    {
        return (await _factory.CreateClient().GetFromJsonAsync<List<DepartureResponse>>(DeparturesUrl))!;
    }

    private static DateTime Utc(int hour, int minute, int second)
    {
        return new DateTime(2026, 11, 14, hour, minute, second, DateTimeKind.Utc);
    }
}
