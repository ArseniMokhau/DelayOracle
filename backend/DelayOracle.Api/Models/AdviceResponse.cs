namespace DelayOracle.Api.Models;

public record AdviceResponse(
    string Status,
    DepartureResponse? Departure,
    DateTime? LeaveBy,
    int? LeaveInMinutes
);