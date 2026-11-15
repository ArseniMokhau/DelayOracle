namespace DelayOracle.Api.Models;

// A commute as the API returns it.
public record CommuteResponse(
    int Id,
    string Name,
    int StopId,
    string? RouteShortName,
    int WalkMinutes,
    DateTime CreatedAt
);