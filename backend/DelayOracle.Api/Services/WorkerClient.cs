using System.Text.Json;
using DelayOracle.Api.Models;
using Microsoft.Extensions.Options;

namespace DelayOracle.Api.Services;

public class WorkerClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    private readonly HttpClient _http;
    private readonly WorkerOptions _options;

    public WorkerClient(HttpClient http, IOptions<WorkerOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public async Task<List<int>> PredictAsync(DateTime observedAt, List<WorkerDeparture> departures, CancellationToken cancellationToken)
    {
        if (!departures.Any())
        {
            return [];
        }

        var request = new WorkerPredictRequest(observedAt, departures);
        var response = await SendAsync<WorkerPredictResponse>(()=> _http.PostAsJsonAsync($"{_options.BaseUrl}/predict", request, JsonOptions, cancellationToken), cancellationToken);

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