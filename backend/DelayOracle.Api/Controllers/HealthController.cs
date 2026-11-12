using DelayOracle.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

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
