using DelayOracle.Api.Models;
using DelayOracle.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

// HTTP endpoints for saved commutes. The controller only translates between HTTP and
// the services: it holds no logic and returns response records, never the entity.
[ApiController]
[Route("api/commutes")]
public class CommutesController : ControllerBase
{
    private readonly CommuteService _commuteService;
    private readonly AdviceService _adviceService;

    public CommutesController(CommuteService commuteService, AdviceService adviceService)
    {
        _commuteService = commuteService;
        _adviceService = adviceService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CommuteResponse>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _commuteService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CommuteResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        // The service returns null for an unknown id, which becomes a 404.
        var commuteResponse = await _commuteService.GetByIdAsync(id, cancellationToken);
        return commuteResponse is null ? NotFound() : Ok(commuteResponse);
    }

    [HttpPost]
    public async Task<ActionResult<CommuteResponse>> Create(CommuteRequest commuteRequest, CancellationToken cancellationToken)
    {
        var created = await _commuteService.CreateAsync(commuteRequest, cancellationToken);
        // 201 with a Location header that points at the new commute.
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CommuteResponse>> Update(int id, CommuteRequest commuteRequest, CancellationToken cancellationToken)
    {
        var commuteResponse = await _commuteService.UpdateAsync(id, commuteRequest, cancellationToken);
        return commuteResponse is null ? NotFound() : Ok(commuteResponse);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deletionResult = await _commuteService.DeleteAsync(id, cancellationToken);
        return deletionResult ? NoContent() : NotFound();
    }

    // When to leave home for this commute, from the live departures of its stop.
    [HttpGet("{id:int}/advice")]
    public async Task<ActionResult<AdviceResponse>> GetAdvice(int id, CancellationToken cancellationToken)
    {
        var adviceResponse = await _adviceService.GetAdviceAsync(id, cancellationToken);
        return adviceResponse is null ? NotFound() : Ok(adviceResponse);
    }
}