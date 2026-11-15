using System.ComponentModel.DataAnnotations;
using DelayOracle.Api.Models;
using DelayOracle.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

// HTTP endpoints for ZTM stops: search by name, and live departures for one stop.
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

    // The attributes on `query` make [ApiController] answer 400 when it is missing or too short.
    [HttpGet]
    public async Task<ActionResult<List<StopResponse>>> Search([FromQuery, Required, MinLength(2)] string query, CancellationToken cancellationToken)
    {
        return Ok(await _stopService.SearchAsync(query, cancellationToken));
    }

    [HttpGet("{stopId:int}")]
    public async Task<ActionResult<StopResponse>> GetById(int stopId, CancellationToken cancellationToken)
    {
        // The service returns null for an unknown id, which becomes a 404.
        var stopResponse = await _stopService.GetByIdAsync(stopId, cancellationToken);
        return stopResponse is null ? NotFound() : Ok(stopResponse);
    }


    // ZTM does not say whether a stop exists, so an unknown id gives an empty list, not a 404.
    [HttpGet("{stopId:int}/departures")]
    public async Task<ActionResult<List<DepartureResponse>>> GetDepartures(int stopId, CancellationToken cancellationToken)
    {
        return Ok(await _departureService.GetDeparturesAsync(stopId, cancellationToken));
    }
}