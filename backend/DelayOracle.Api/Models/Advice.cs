namespace DelayOracle.Api.Models;

public record Advice(
    DateTime PredictedTime,
    DateTime LeaveBy,
    int LeaveInMinutes
);