using DelayOracle.Api.Models;
using DelayOracle.Api.Services;

namespace DelayOracle.Tests;

// The examples from the "Advice rule" section of docs/ARCHITECTURE.md:
// now is 07:00 and the walk takes 5 minutes, so leaveBy is the predicted time minus 6 minutes.
public class AdviceCalculatorTests
{
    private const int WalkMinutes = 5;
    private static readonly DateTime Now = At(7, 0);

    [Fact]
    public void DepartureIn12Minutes_LeaveIn6Minutes()
    {
        var advice = AdviceCalculator.Calculate([At(7, 12)], WalkMinutes, Now);

        Assert.Equal(new Advice(At(7, 12), At(7, 6), 6), advice);
    }

    [Fact]
    public void DepartureIn6Minutes_LeaveNow()
    {
        var advice = AdviceCalculator.Calculate([At(7, 6)], WalkMinutes, Now);

        Assert.Equal(new Advice(At(7, 6), At(7, 0), 0), advice);
    }

    [Fact]
    public void FirstDepartureTooSoon_UsesTheNextOne()
    {
        var advice = AdviceCalculator.Calculate([At(7, 4), At(7, 20)], WalkMinutes, Now);

        Assert.Equal(new Advice(At(7, 20), At(7, 14), 14), advice);
    }

    [Fact]
    public void OnlyDepartureTooSoon_NoDeparture()
    {
        var advice = AdviceCalculator.Calculate([At(7, 3)], WalkMinutes, Now);

        Assert.Null(advice);
    }

    [Fact]
    public void NoDepartures_NoDeparture()
    {
        var advice = AdviceCalculator.Calculate([], WalkMinutes, Now);

        Assert.Null(advice);
    }

    [Fact]
    public void UnsortedDepartures_PicksTheEarliestCatchable()
    {
        var advice = AdviceCalculator.Calculate([At(7, 30), At(7, 4), At(7, 20)], WalkMinutes, Now);

        Assert.Equal(new Advice(At(7, 20), At(7, 14), 14), advice);
    }

    [Fact]
    public void PartialMinute_RoundsDownToWholeMinutes()
    {
        var predictedTime = At(7, 12).AddSeconds(30);

        var advice = AdviceCalculator.Calculate([predictedTime], WalkMinutes, Now);

        Assert.Equal(6, advice?.LeaveInMinutes);
    }

    [Fact]
    public void LeaveByThirtySecondsAgo_NoDeparture()
    {
        var predictedTime = At(7, 5).AddSeconds(30);

        var advice = AdviceCalculator.Calculate([predictedTime], WalkMinutes, Now);

        Assert.Null(advice);
    }

    private static DateTime At(int hour, int minute)
    {
        return new DateTime(2026, 11, 16, hour, minute, 0, DateTimeKind.Utc);
    }
}
