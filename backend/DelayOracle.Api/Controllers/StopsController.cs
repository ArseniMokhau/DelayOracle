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
    private readonly DepartureService _departureService;

    public StopsController(StopService stopService, DepartureService departureService)
    {
        _stopService = stopService;
        _departureService = departureService;
    }

    [HttpGet]
    public async Task<ActionResult<List<StopResponse>>> Search([FromQuery, Required, MinLength(2)] string query, CancellationToken cancellationToken)
    {
        return Ok(await _stopService.SearchAsync(query, cancellationToken));
    }

    [HttpGet("{stopId:int}/departures")]
    public async Task<ActionResult<List<DepartureResponse>>> GetDepartures(int stopId, CancellationToken cancellationToken)
    {
        return Ok(await _departureService.GetDeparturesAsync(stopId, cancellationToken));
    }
}