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
            return new DepartureResponse(departure.RouteShortName, 
                departure.Headsign, departure.TheoreticalTime, departure.EstimatedTime, 
                departure.DelayInSeconds, departure.DelayInSeconds, departure.EstimatedTime, PredictionSource.Fallback);
        }
        else
        {
            return new DepartureResponse(departure.RouteShortName, 
                departure.Headsign, departure.TheoreticalTime, departure.TheoreticalTime, 
                null, null, departure.TheoreticalTime, PredictionSource.Schedule);
        }

    }
}