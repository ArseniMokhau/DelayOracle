namespace DelayOracle.Api.Models;

public record StopResponse(
    int Id,
    string Name,
    string? Code,
    string? Zone
);