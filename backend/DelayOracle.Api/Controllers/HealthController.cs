using DelayOracle.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

// Liveness check: answers as soon as the API process is running.
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public ActionResult<HealthResponse> Get()
    {
        return Ok(new HealthResponse("ok"));
    }
}
