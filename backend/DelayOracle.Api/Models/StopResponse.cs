namespace DelayOracle.Api.Models;

// A stop as the API returns it. Code tells apart the platforms that share a name.
public record StopResponse(
    int Id,
    string Name,
    string? Code,
    string? Zone
);