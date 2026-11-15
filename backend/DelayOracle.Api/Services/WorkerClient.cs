using System.Text.Json;
using DelayOracle.Api.Models;
using Microsoft.Extensions.Options;

namespace DelayOracle.Api.Services;

// Calls the Python prediction worker. Every way a call can fail becomes a
// WorkerUnavailableException, so callers have one thing to handle.
public class WorkerClient
{
    private readonly HttpClient _http;
    private readonly WorkerOptions _options;

    public WorkerClient(HttpClient http, IOptions<WorkerOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    // The predicted final delay in seconds for each departure, in the same order.
    public async Task<List<int>> PredictAsync(DateTime observedAt, List<WorkerDeparture> departures, CancellationToken cancellationToken)
    {
        if (!departures.Any())
        {
            return [];
        }

        var request = new WorkerPredictRequest(observedAt, departures);
        var response = await SendAsync<WorkerPredictResponse>(()=> _http.PostAsJsonAsync($"{_options.BaseUrl}/predict", request, JsonOptions, cancellationToken), cancellationToken);

        // A list of the wrong length would attach predictions to the wrong departures.
        if (response.PredictedDelaysS?.Count != departures.Count) 
        {
            throw new WorkerUnavailableException("The worker did not return one prediction per departure.");
        }

        return response.PredictedDelaysS;
    }

    public async Task<ModelCardResponse> GetModelCardAsync(CancellationToken cancellationToken)
    {
        return await SendAsync<ModelCardResponse>(()=> _http.GetAsync($"{_options.BaseUrl}/model", cancellationToken), cancellationToken);
    }

    // The worker's JSON uses snake_case names: ObservedAt is sent as observed_at.
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };
    
    // Runs one HTTP call, reads the JSON answer as T, and maps the failures.
    private static async Task<T> SendAsync<T>(
        Func<Task<HttpResponseMessage>> send, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await send();
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken)
                ?? throw new JsonException("The worker returned null.");
        }
        catch (HttpRequestException exception)
        {
            throw new WorkerUnavailableException("The request to the worker failed.", exception);
        }
        // HttpClient reports its own timeout as a cancellation. If the caller cancelled
        // (the user closed the page), the exception is not a timeout and is passed on.
        catch (OperationCanceledException exception)  when (!cancellationToken.IsCancellationRequested)
        {
            throw new WorkerUnavailableException("The request to the worker timed out.", exception);
        }
        catch (JsonException exception)
        {
            throw new WorkerUnavailableException("Json deserialization failed", exception);
        }
    }
}