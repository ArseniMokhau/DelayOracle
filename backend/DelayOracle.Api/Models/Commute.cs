namespace DelayOracle.Api.Models;

public class Commute
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int StopId { get; set; }
    public string? RouteShortName { get; set; }
    public int WalkMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
}