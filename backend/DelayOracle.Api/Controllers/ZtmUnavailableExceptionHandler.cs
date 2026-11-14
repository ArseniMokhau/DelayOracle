using DelayOracle.Api.Services;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

// Turns a ZtmUnavailableException from any endpoint into a 503 ProblemDetails response.
public class ZtmUnavailableExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetails;

    public ZtmUnavailableExceptionHandler(IProblemDetailsService problemDetails)
    {
        _problemDetails = problemDetails;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not ZtmUnavailableException)
        {
            // Not ours: let the default handler answer with a 500.
            return false;
        }

        httpContext.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        return await _problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "ZTM Gdańsk is unavailable",
                Detail = "Live public transport data could not be loaded. Try again in a moment.",
            },
        });
    }
}
