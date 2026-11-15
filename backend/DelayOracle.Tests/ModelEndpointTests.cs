using System.Net;
using System.Net.Http.Json;
using DelayOracle.Api.Models;

namespace DelayOracle.Tests;

public class ModelEndpointTests : IDisposable
{
    private readonly ApiFactory _factory = new();

    public void Dispose()
    {
        _factory.Dispose();
    }

    [Fact]
    public async Task Get_ReturnsTheModelCardOfTheWorker()
    {
        _factory.WorkerHandler = FakeWorker.Predicting(delay => delay);

        var card = await _factory.CreateClient().GetFromJsonAsync<ModelCardResponse>("/api/model");

        Assert.NotNull(card);
        Assert.Equal("PyTorch network, two hidden layers of 32", card.Model);
        Assert.Equal(["current_delay_s", "minutes_to_departure", "hour"], card.Features);
        Assert.Equal(new ModelCardRows(Train: 22488, Test: 5622), card.Rows);
        Assert.Equal(new ModelCardMae(Model: 113.0, Baseline: 159.2), card.MaeSeconds);
    }

    [Fact]
    public async Task Get_JsonUsesCamelCase()
    {
        _factory.WorkerHandler = FakeWorker.Predicting(delay => delay);

        var json = await _factory.CreateClient().GetStringAsync("/api/model");

        Assert.Contains("\"maeSeconds\":{", json);
        Assert.Contains("\"trainedAtUtc\":\"2026-11-15T02:40:00Z\"", json);
    }

    [Fact]
    public async Task Get_WhenTheWorkerIsDown_Returns503ProblemDetails()
    {
        _factory.WorkerHandler = FakeWorker.Down();

        var response = await _factory.CreateClient().GetAsync("/api/model");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }
}
