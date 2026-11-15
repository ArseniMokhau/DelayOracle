using DelayOracle.Api.Models;
using DelayOracle.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

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
        var commuteResponse = await _commuteService.GetByIdAsync(id, cancellationToken);
        return commuteResponse is null ? NotFound() : Ok(commuteResponse);
    }

    [HttpPost]
    public async Task<ActionResult<CommuteResponse>> Create(CommuteRequest commuteRequest, CancellationToken cancellationToken)
    {
        var created = await _commuteService.CreateAsync(commuteRequest, cancellationToken);
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

    [HttpGet("{id:int}/advice")]
    public async Task<ActionResult<AdviceResponse>> GetAdvice(int id, CancellationToken cancellationToken)
    {
        var adviceResponse = await _adviceService.GetAdviceAsync(id, cancellationToken);
        return adviceResponse is null ? NotFound() : Ok(adviceResponse);
    }
}