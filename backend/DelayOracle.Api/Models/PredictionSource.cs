namespace DelayOracle.Api.Models;

// Where the predicted delay of a departure came from.
public static class PredictionSource
{
    // The worker was unavailable, so ZTM's own current delay is used.
    public const string Fallback = "fallback";
    // ZTM has no live data for the departure, so only the timetable is known.
    public const string Schedule = "schedule";
    // The trained model in the worker predicted the delay.
    public const string Model = "model";

}
