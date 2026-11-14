using System.ComponentModel.DataAnnotations;
using DelayOracle.Api.Models;
using DelayOracle.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

[ApiController]
[Route("api/stops")]
public class StopsController : ControllerBase
{
    private readonly StopService _stopService;

    public StopsController(StopService stopService)
    {
        _stopService = stopService;
    }

    [HttpGet]
    public async Task<ActionResult<List<StopResponse>>> Search([FromQuery, Required, MinLength(2)] string query, CancellationToken cancellationToken)
    {
        return Ok(await _stopService.SearchAsync(query, cancellationToken));
    }
}