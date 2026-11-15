using DelayOracle.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace DelayOracle.Api.Services;

public class StopService
{
    private const int MaxResults = 20;
    private const string CacheKey = "stops";

    private readonly ZtmClient _ztm;
    private readonly IMemoryCache _cache;

    public StopService(ZtmClient ztmClient, IMemoryCache memoryCache)
    {
        _ztm = ztmClient;
        _cache = memoryCache;
    }

    public async Task<List<StopResponse>> SearchAsync(string query, CancellationToken cancellationToken)
    {
        var stops = await GetStopsAsync(cancellationToken);
        var searchText = SearchText.Normalize(query);
        var querriedStops = stops.Where(stop => SearchText.Normalize(stop.Name).Contains(searchText)).Take(MaxResults).ToList();

        return querriedStops;
    }

    private async Task<List<StopResponse>> GetStopsAsync(CancellationToken cancellationToken)
    {
        if (_cache.TryGetValue(CacheKey, out List<StopResponse>? cached) && cached != null)
        {
            return cached;
        }
        else
        {
            var stopsList = await _ztm.GetStopsAsync(cancellationToken);
            var cleanedStopsList = stopsList.Where(stop => stop.StopName != null)
                                            .DistinctBy(stop => stop.StopId)
                                            .Select(stop => new StopResponse(Name: stop.StopName!, Id: stop.StopId, Code: stop.StopCode, Zone: stop.ZoneName))
                                            .OrderBy(stop => stop.Name)
                                            .ThenBy(stop => stop.Code)
                                            .ToList();
            _cache.Set(CacheKey, cleanedStopsList, TimeSpan.FromHours(12));

            return cleanedStopsList;
        }
    }
}