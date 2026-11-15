namespace DelayOracle.Api.Services;

// Settings for calling the prediction worker, read from the "Worker" section of appsettings.json.
public class WorkerOptions
{
    public string BaseUrl { get; set; } = "";

    // Short on purpose: when the worker is slow the API falls back to ZTM's own delay.
    public int TimeoutSeconds { get; set; } = 3;
}
