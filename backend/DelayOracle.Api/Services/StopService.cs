using DelayOracle.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace DelayOracle.Api.Services;

// Searches stops by name. The full stop list is large and changes rarely,
// so it is downloaded from ZTM once and kept in memory.
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

    // Returns null when there is no stop with this id.
    public async Task<StopResponse?> GetByIdAsync(int stopId, CancellationToken cancellationToken)
    {
        var stops = await GetStopsAsync(cancellationToken);

        return stops.FirstOrDefault(stop => stop.Id == stopId);
    }


    // The cleaned stop list, from the cache when it is there.
    private async Task<List<StopResponse>> GetStopsAsync(CancellationToken cancellationToken)
    {
        if (_cache.TryGetValue(CacheKey, out List<StopResponse>? cached) && cached != null)
        {
            return cached;
        }
        else
        {
            var stopsList = await _ztm.GetStopsAsync(cancellationToken);
            // The file repeats every stop once per day and contains stops without a name.
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