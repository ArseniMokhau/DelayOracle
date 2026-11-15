using DelayOracle.Api.Models;

namespace DelayOracle.Api.Services;

public class AdviceService
{
    private readonly CommuteService _commuteService;
    private readonly DepartureService _departureService;
    private readonly TimeProvider _timeProvider;

    public AdviceService(CommuteService commuteService, DepartureService departureService, TimeProvider timeProvider)
    {
        _commuteService = commuteService;
        _departureService = departureService;
        _timeProvider = timeProvider;
    }

    public async Task<AdviceResponse?> GetAdviceAsync(int commuteId, CancellationToken cancellationToken)
    {
        var commute = await _commuteService.GetByIdAsync(commuteId, cancellationToken);
        if (commute is null) { return null; }
        
        var departures = await _departureService.GetDeparturesAsync(commute.StopId, cancellationToken);
        if (commute.RouteShortName is not null)
        {
            departures = departures.Where(departure => departure.Route == commute.RouteShortName).ToList();
        }

        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var advice = AdviceCalculator.Calculate(departures.Select(departure => departure.PredictedTime), commute.WalkMinutes, now);
        if (advice is null) return new AdviceResponse(AdviceStatus.NoDeparture, null, null, null);

        var chosenDeparture = departures.First(departure => departure.PredictedTime == advice.PredictedTime);

        return new AdviceResponse(AdviceStatus.Leave, chosenDeparture, advice.LeaveBy, advice.LeaveInMinutes);
    }
}