using System.ComponentModel.DataAnnotations;

namespace DelayOracle.Api.Models;

// The body of POST and PUT /api/commutes. The attributes are the validation rules;
// [ApiController] answers 400 with the field errors when one is broken.
public record CommuteRequest(
    [Required, StringLength(60)] string Name,
    [Range(1, int.MaxValue)] int StopId,
    [StringLength(8)] string? RouteShortName,
    [Range(0, 60)] int WalkMinutes
);