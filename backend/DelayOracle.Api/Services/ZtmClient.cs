using System.Text.Json;
using DelayOracle.Api.Models;
using Microsoft.Extensions.Options;

namespace DelayOracle.Api.Services;

// Calls the ZTM Gdańsk open data API. Every way a call can fail becomes a
// ZtmUnavailableException, which the API answers with a 503.
public class ZtmClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly ZtmOptions _options;

    public ZtmClient(HttpClient httpClient, IOptions<ZtmOptions> options)
    {
        _http = httpClient;
        _options = options.Value;
    }

    public async Task<List<ZtmDeparture>> GetDeparturesAsync(int stopId, CancellationToken cancellationToken)
    {
        var json = await GetStringAsync($"{_options.DeparturesUrl}?stopId={stopId}", cancellationToken);
        
        // ZTM answers 200 with an empty body for a stop id it does not know.
        return json == "" ? [] : Parse<ZtmDeparturesResponse>(json).Departures;
    }

    public async Task<List<ZtmStop>> GetStopsAsync(CancellationToken cancellationToken)
    {
        var json = await GetStringAsync($"{_options.StopsUrl}", cancellationToken);

        // The file is an object keyed by date; the stops of all days are joined into one list.
        return [.. Parse<Dictionary<string, ZtmStopsDay>>(json).Values.SelectMany(day => day.Stops)];
    }

    private async Task<string> GetStringAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            return await _http.GetStringAsync(url, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw new ZtmUnavailableException("The request to ZTM failed.", exception);
        }
        // HttpClient reports its own timeout as a cancellation. If the caller cancelled
        // (the user closed the page), the exception is not a timeout and is passed on.
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw new ZtmUnavailableException("The request to ZTM timed out.", exception);  
        }
    }

    private static T Parse<T>(string json)
    {
        try
        {
            var deserializedJson = JsonSerializer.Deserialize<T>(json, JsonOptions) ?? throw new JsonException("ZTM returned null");
            return deserializedJson;
        }
        catch (JsonException exception)
        {
            throw new ZtmUnavailableException("Json deserialization failed", exception);
        }
    }
}