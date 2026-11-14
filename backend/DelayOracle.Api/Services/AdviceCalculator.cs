using DelayOracle.Api.Models;

namespace DelayOracle.Api.Services;

public static class AdviceCalculator
{
    public static Advice? Calculate(IEnumerable<DateTime> predictedTimes, int walkMinutes, DateTime now)
    {
        var orderedTimes = predictedTimes.Order();
        foreach (var time in orderedTimes)
        {
            var leaveBy = time.Subtract(TimeSpan.FromMinutes(walkMinutes + 1));
            if (leaveBy >= now)
            {
                return new Advice(
                    time,
                    leaveBy,
                    (int)(leaveBy - now).TotalMinutes
                );
            }
        }
        return null;
    }
}