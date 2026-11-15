namespace DelayOracle.Api.Models;

// A saved trip: which stop, optionally which line, and how long the walk to the stop takes.
// This is the database entity; the API exposes it as CommuteResponse.
public class Commute
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public int StopId { get; set; }
    // Null means any line from this stop.
    public string? RouteShortName { get; set; }
    public int WalkMinutes { get; set; }
    // Always UTC.
    public DateTime CreatedAt { get; set; }
}