using DelayOracle.Api.Models;

namespace DelayOracle.Api.Services;

// Answers "when should I leave?" for a saved commute by combining the commute,
// the live departures of its stop and the advice rule.
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

    // Returns null when the commute does not exist.
    public async Task<AdviceResponse?> GetAdviceAsync(Guid commuteId, CancellationToken cancellationToken)
    {
        var commute = await _commuteService.GetByIdAsync(commuteId, cancellationToken);
        if (commute is null) { return null; }
        
        var departures = await _departureService.GetDeparturesAsync(commute.StopId, cancellationToken);
        // A commute without a line accepts any line from the stop.
        if (commute.RouteShortName is not null)
        {
            departures = departures.Where(departure => departure.Route == commute.RouteShortName).ToList();
        }

        // The clock is injected, so tests can fix the current time.
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var advice = AdviceCalculator.Calculate(departures.Select(departure => departure.PredictedTime), commute.WalkMinutes, now);
        if (advice is null) return new AdviceResponse(AdviceStatus.NoDeparture, null, null, null);

        // The calculator works on times only; find the departure that the chosen time belongs to.
        var chosenDeparture = departures.First(departure => departure.PredictedTime == advice.PredictedTime);

        return new AdviceResponse(AdviceStatus.Leave, chosenDeparture, advice.LeaveBy, advice.LeaveInMinutes);
    }
}