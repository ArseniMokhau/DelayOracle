using DelayOracle.Api.Models;

namespace DelayOracle.Api.Services;

public class DepartureService
{
    private readonly ZtmClient _ztm;

    public DepartureService(ZtmClient ztm)
    {
        _ztm = ztm;
    }

    public async Task<List<DepartureResponse>> GetDeparturesAsync(int stopId, CancellationToken cancellationToken)
    {
        var departures = await _ztm.GetDeparturesAsync(stopId, cancellationToken);
        var departureResponses = departures.Select(ToResponse)
                                        .OrderBy(departure => departure.PredictedTime).ToList();

        return departureResponses;
    }

    private static DepartureResponse ToResponse(ZtmDeparture departure)
    {
        if (departure.Status == "REALTIME" && departure.DelayInSeconds != null)
        {
            return new DepartureResponse(Route: departure.RouteShortName,
                Headsign: departure.Headsign, ScheduledTime: departure.TheoreticalTime,
                EstimatedTime: departure.EstimatedTime, CurrentDelaySeconds: departure.DelayInSeconds,
                PredictedDelaySeconds: departure.DelayInSeconds, PredictedTime: departure.EstimatedTime,
                Source: PredictionSource.Fallback);
        }

        return new DepartureResponse(Route: departure.RouteShortName,
            Headsign: departure.Headsign, ScheduledTime: departure.TheoreticalTime,
            EstimatedTime: departure.TheoreticalTime, CurrentDelaySeconds: null,
            PredictedDelaySeconds: null, PredictedTime: departure.TheoreticalTime,
            Source: PredictionSource.Schedule);
    }
}