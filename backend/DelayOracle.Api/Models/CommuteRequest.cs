using System.ComponentModel.DataAnnotations;

namespace DelayOracle.Api.Models;

public record CommuteRequest(
    [Required, StringLength(60)] string Name,
    [Range(1, int.MaxValue)] int StopId,
    [StringLength(8)] string? RouteShortName,
    [Range(0, 60)] int WalkMinutes
);