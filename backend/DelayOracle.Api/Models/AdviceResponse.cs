namespace DelayOracle.Api.Models;

// The answer of GET /api/commutes/{id}/advice. When no departure can be caught,
// Status is "noDeparture" and the other values are null.
public record AdviceResponse(
    string Status,
    DepartureResponse? Departure,
    DateTime? LeaveBy,
    int? LeaveInMinutes
);