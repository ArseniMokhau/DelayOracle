namespace DelayOracle.Api.Models;

// The result of the advice rule for one departure: when it leaves, the latest moment
// to leave home, and the whole minutes from now until then (0 means leave now).
public record Advice(
    DateTime PredictedTime,
    DateTime LeaveBy,
    int LeaveInMinutes
);