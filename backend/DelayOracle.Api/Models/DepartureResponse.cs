namespace DelayOracle.Api.Models;

// One departure from a stop. ScheduledTime, EstimatedTime and CurrentDelaySeconds are what
// ZTM reports; the Predicted values are ours, and Source says where they came from
// (see PredictionSource). The delays are null when ZTM has no live data. Times are UTC.
public record DepartureResponse(
    string Route,
    string Headsign,
    DateTime ScheduledTime,
    DateTime EstimatedTime,
    int? CurrentDelaySeconds,
    int? PredictedDelaySeconds,
    DateTime PredictedTime,
    string Source
);