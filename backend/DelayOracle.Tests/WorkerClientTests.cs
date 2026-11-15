using System.Net;
using System.Text.Json.Nodes;
using DelayOracle.Api.Models;
using DelayOracle.Api.Services;
using Microsoft.Extensions.Options;

namespace DelayOracle.Tests;

// The worker client against a fake HTTP handler: what it sends, what it returns,
// and that every kind of failure becomes a WorkerUnavailableException.
public class WorkerClientTests
{
    private const string TwoPredictions = """{"predicted_delays_s":[230,-10]}""";

    private static readonly DateTime ObservedAt = Utc(17, 0, 0);

    private static readonly List<WorkerDeparture> TwoDepartures =
    [
        new(ScheduledTime: Utc(17, 21, 0), CurrentDelayS: 205),
        new(ScheduledTime: Utc(17, 40, 0), CurrentDelayS: -30),
    ];

    [Fact]
    public async Task Predict_PostsSnakeCaseJsonToThePredictEndpoint()
    {
        string? sentBody = null;
        var handler = new FakeHttpHandler(request =>
        {
            sentBody = request.Content!.ReadAsStringAsync().Result;
            return FakeHttpHandler.JsonResponse(TwoPredictions);
        });

        await CreateClient(handler).PredictAsync(ObservedAt, TwoDepartures, CancellationToken.None);

        Assert.Equal(["http://worker.test/predict"], handler.RequestedUrls);
        var body = JsonNode.Parse(sentBody!)!;
        Assert.Equal("2026-11-14T17:00:00Z", (string?)body["observed_at"]);
        Assert.Equal("2026-11-14T17:21:00Z", (string?)body["departures"]![0]!["scheduled_time"]);
        Assert.Equal(205, (int?)body["departures"]![0]!["current_delay_s"]);
        Assert.Equal(-30, (int?)body["departures"]![1]!["current_delay_s"]);
    }

    [Fact]
    public async Task Predict_ReturnsThePredictionsInOrder()
    {
        var client = CreateClient(FakeHttpHandler.Returning(TwoPredictions));

        var predictions = await client.PredictAsync(ObservedAt, TwoDepartures, CancellationToken.None);

        Assert.Equal([230, -10], predictions);
    }

    [Fact]
    public async Task Predict_WithoutDepartures_ReturnsEmptyListAndDoesNotCallTheWorker()
    {
        var handler = FakeHttpHandler.Returning("""{"predicted_delays_s":[]}""");

        var predictions = await CreateClient(handler).PredictAsync(ObservedAt, [], CancellationToken.None);

        Assert.Empty(predictions);
        Assert.Empty(handler.RequestedUrls);
    }

    [Theory]
    [InlineData("""{"predicted_delays_s":[230]}""")] // one prediction for two departures
    [InlineData("""{"something_else":true}""")]
    [InlineData("not json")]
    [InlineData("")]
    public async Task Predict_UnusableAnswer_ThrowsWorkerUnavailable(string body)
    {
        var client = CreateClient(FakeHttpHandler.Returning(body));

        await Assert.ThrowsAsync<WorkerUnavailableException>(
            () => client.PredictAsync(ObservedAt, TwoDepartures, CancellationToken.None));
    }

    [Fact]
    public async Task Predict_WorkerAnswersWithAnError_ThrowsWorkerUnavailable()
    {
        var client = CreateClient(FakeHttpHandler.Returning("down", HttpStatusCode.InternalServerError));

        await Assert.ThrowsAsync<WorkerUnavailableException>(
            () => client.PredictAsync(ObservedAt, TwoDepartures, CancellationToken.None));
    }

    [Fact]
    public async Task Predict_WorkerCannotBeReached_ThrowsWorkerUnavailable()
    {
        var client = CreateClient(FakeHttpHandler.Throwing(new HttpRequestException("connection refused")));

        await Assert.ThrowsAsync<WorkerUnavailableException>(
            () => client.PredictAsync(ObservedAt, TwoDepartures, CancellationToken.None));
    }

    [Fact]
    public async Task Predict_WorkerTimesOut_ThrowsWorkerUnavailable()
    {
        // HttpClient reports its own timeout as a TaskCanceledException.
        var client = CreateClient(FakeHttpHandler.Throwing(new TaskCanceledException("timeout")));

        await Assert.ThrowsAsync<WorkerUnavailableException>(
            () => client.PredictAsync(ObservedAt, TwoDepartures, CancellationToken.None));
    }

    [Fact]
    public async Task GetModelCard_ReadsTheSnakeCaseCardOfTheWorker()
    {
        // The fields of ai-worker/models/model_card.json that the API passes on, and one it ignores.
        var handler = FakeHttpHandler.Returning("""
            {
              "model": "PyTorch network, two hidden layers of 32",
              "features": ["current_delay_s", "minutes_to_departure", "hour"],
              "rows": {"train": 22488, "test": 5622},
              "mae_seconds": {"model": 113.0, "baseline": 159.2},
              "trained_at_utc": "2026-11-15T02:40:00Z",
              "seed": 42
            }
            """);

        var card = await CreateClient(handler).GetModelCardAsync(CancellationToken.None);

        Assert.Equal(["http://worker.test/model"], handler.RequestedUrls);
        Assert.Equal("PyTorch network, two hidden layers of 32", card.Model);
        Assert.Equal(["current_delay_s", "minutes_to_departure", "hour"], card.Features);
        Assert.Equal(new ModelCardRows(Train: 22488, Test: 5622), card.Rows);
        Assert.Equal(new ModelCardMae(Model: 113.0, Baseline: 159.2), card.MaeSeconds);
        Assert.Equal(new DateTime(2026, 11, 15, 2, 40, 0, DateTimeKind.Utc), card.TrainedAtUtc);
    }

    [Fact]
    public async Task GetModelCard_WorkerAnswersWithAnError_ThrowsWorkerUnavailable()
    {
        var client = CreateClient(FakeHttpHandler.Returning("down", HttpStatusCode.InternalServerError));

        await Assert.ThrowsAsync<WorkerUnavailableException>(
            () => client.GetModelCardAsync(CancellationToken.None));
    }

    private static WorkerClient CreateClient(FakeHttpHandler handler)
    {
        var options = Options.Create(new WorkerOptions { BaseUrl = "http://worker.test" });
        return new WorkerClient(new HttpClient(handler), options);
    }

    private static DateTime Utc(int hour, int minute, int second)
    {
        return new DateTime(2026, 11, 14, hour, minute, second, DateTimeKind.Utc);
    }
}
