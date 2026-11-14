namespace DelayOracle.Api.Models;

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