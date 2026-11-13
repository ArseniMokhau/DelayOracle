namespace DelayOracle.Api.Models;

public record CommuteResponse(
    int Id,
    string Name,
    int StopId,
    string? RouteShortName,
    int WalkMinutes,
    DateTime CreatedAt
);