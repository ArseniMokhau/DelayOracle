namespace DelayOracle.Api.Services;

// Filled from the "Ztm" section of appsettings.json.
public class ZtmOptions
{
    public string DeparturesUrl { get; set; } = "";
    public string StopsUrl { get; set; } = "";
    public int TimeoutSeconds { get; set; } = 15;
}
