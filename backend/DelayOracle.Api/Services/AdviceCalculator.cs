using DelayOracle.Api.Models;

namespace DelayOracle.Api.Services;

// The advice rule as a plain calculation without any I/O, so it can be unit tested directly.
public static class AdviceCalculator
{
    // Picks the earliest departure the user can still catch. Returns null when there is none.
    public static Advice? Calculate(IEnumerable<DateTime> predictedTimes, int walkMinutes, DateTime now)
    {
        var orderedTimes = predictedTimes.Order();
        foreach (var time in orderedTimes)
        {
            // Leave early enough to walk to the stop, plus one minute of margin.
            var leaveBy = time.Subtract(TimeSpan.FromMinutes(walkMinutes + 1));
            if (leaveBy >= now)
            {
                return new Advice(
                    time,
                    leaveBy,
                    // Whole minutes, rounded down: 59 seconds left still means "leave now".
                    (int)(leaveBy - now).TotalMinutes
                );
            }
        }
        return null;
    }
}