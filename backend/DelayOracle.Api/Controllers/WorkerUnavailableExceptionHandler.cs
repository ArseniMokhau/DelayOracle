using DelayOracle.Api.Services;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

// Turns a WorkerUnavailableException that an endpoint did not handle itself into a 503 ProblemDetails
// response. Departures never get here: they fall back to ZTM's own delay instead.
public class WorkerUnavailableExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetails;

    public WorkerUnavailableExceptionHandler(IProblemDetailsService problemDetails)
    {
        _problemDetails = problemDetails;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not WorkerUnavailableException)
        {
            // Not ours: let the next handler try.
            return false;
        }

        httpContext.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        return await _problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "The prediction model is unavailable",
                Detail = "Information about the prediction model could not be loaded. Try again in a moment.",
            },
        });
    }
}
