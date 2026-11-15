namespace DelayOracle.Api.Services;

// Thrown when the prediction worker cannot be reached or its answer cannot be used.
public class WorkerUnavailableException : Exception
{
    public WorkerUnavailableException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
