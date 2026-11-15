using DelayOracle.Api.Models;

namespace DelayOracle.Api.Services;

public class DepartureService
{
    private readonly ZtmClient _ztm;
    private readonly WorkerClient _worker;
    private readonly TimeProvider _timeProvider;

    public DepartureService(ZtmClient ztm, WorkerClient worker, TimeProvider timeProvider)
    {
        _ztm = ztm;
        _worker = worker;
        _timeProvider = timeProvider;
    }

    public async Task<List<DepartureResponse>> GetDeparturesAsync(int stopId, CancellationToken cancellationToken)
    {
        var ztmDepartures = await _ztm.GetDeparturesAsync(stopId, cancellationToken);
        var departures = ztmDepartures.Select(ToResponse).ToList();
        departures = await AddPredictionsAsync(departures, cancellationToken);

        return departures.OrderBy(departure => departure.PredictedTime).ToList();
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

    private async Task<List<DepartureResponse>> AddPredictionsAsync(List<DepartureResponse> departures, CancellationToken cancellationToken)
    {
        var live = departures.Where(departure => departure.CurrentDelaySeconds != null).ToList();

        var workerDepartures = live.Select(departure => 
            new WorkerDeparture(ScheduledTime: departure.ScheduledTime, CurrentDelayS: departure.CurrentDelaySeconds!.Value)).ToList();

        List<int> predictions;
        try
        {
            var now = _timeProvider.GetUtcNow().UtcDateTime;
            predictions = await _worker.PredictAsync(observedAt: now, departures: workerDepartures, cancellationToken);
        }
        catch (WorkerUnavailableException)
        {
            return departures;
        }

        var result = departures.Where(departure => departure.CurrentDelaySeconds == null).ToList();
        for (var i = 0; i < live.Count; i++)
        {
            result.Add(live[i] with 
            {
                PredictedDelaySeconds = predictions[i], 
                PredictedTime = live[i].ScheduledTime.AddSeconds(predictions[i]), 
                Source = PredictionSource.Model
            });
        }

        return result;
    }
}