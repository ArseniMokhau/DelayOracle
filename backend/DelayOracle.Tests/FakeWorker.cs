using System.Text.Json;
using System.Text.Json.Nodes;

namespace DelayOracle.Tests;

// Stands in for the prediction worker. The predictions are made up by each test, not by a model.
public static class FakeWorker
{
    public const string ModelCardJson = """
        {
          "model": "PyTorch network, two hidden layers of 32",
          "features": ["current_delay_s", "minutes_to_departure", "hour"],
          "rows": {"train": 22488, "test": 5622},
          "mae_seconds": {"model": 113.0, "baseline": 159.2},
          "trained_at_utc": "2026-11-15T02:40:00Z",
          "seed": 42
        }
        """;

    // A worker that is not running: every call fails.
    public static FakeHttpHandler Down()
    {
        return FakeHttpHandler.Throwing(new HttpRequestException("The worker is not running."));
    }

    // A worker whose prediction for each departure is `predict(current delay)`.
    // The bodies of the /predict requests it receives are added to `receivedBodies`.
    public static FakeHttpHandler Predicting(Func<int, int> predict, List<JsonNode>? receivedBodies = null)
    {
        return new FakeHttpHandler(request =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("/model"))
            {
                return FakeHttpHandler.JsonResponse(ModelCardJson);
            }

            var body = JsonNode.Parse(request.Content!.ReadAsStringAsync().Result)!;
            receivedBodies?.Add(body);
            var predictions = body["departures"]!.AsArray()
                .Select(departure => predict((int)departure!["current_delay_s"]!));
            return FakeHttpHandler.JsonResponse(
                JsonSerializer.Serialize(new { predicted_delays_s = predictions }));
        });
    }
}
