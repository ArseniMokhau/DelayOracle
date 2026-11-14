namespace DelayOracle.Api.Services;

// Thrown when ZTM cannot be reached, is too slow, or returns something unreadable.
public class ZtmUnavailableException : Exception
{
    public ZtmUnavailableException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
