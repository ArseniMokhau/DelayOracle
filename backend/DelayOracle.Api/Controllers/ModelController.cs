using DelayOracle.Api.Models;
using DelayOracle.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DelayOracle.Api.Controllers;

[ApiController]
[Route("api/model")]
public class ModelController : ControllerBase
{
    private readonly WorkerClient _workerClient;

    public ModelController(WorkerClient workerClient)
    {
        _workerClient = workerClient;
    }

    [HttpGet]
    public async Task<ActionResult<ModelCardResponse>> GetModelCard(CancellationToken cancellationToken)
    {
        return await _workerClient.GetModelCardAsync(cancellationToken);
    }
}