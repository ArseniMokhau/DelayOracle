using System.Net;
using System.Net.Http.Json;
using DelayOracle.Api.Models;

namespace DelayOracle.Tests;

// The fake ZTM answers with Fixtures/ztm-departures.json. Predicted times:
// route 154 at 17:24:25, route 186 at 17:24:26, route 208 at 17:40:00.
// With a 5 minute walk, leaveBy is the predicted time minus 6 minutes.
public class AdviceEndpointTests : IDisposable
{
    private const int WalkMinutes = 5;

    private readonly ApiFactory _factory = new();

    public void Dispose()
    {
        _factory.Dispose();
    }

    [Fact]
    public async Task Advice_UsesTheEarliestDepartureTheUserCanStillCatch()
    {
        _factory.Now = Utc(17, 15, 0);
        var commute = await CreateCommuteAsync(route: null);

        var advice = await GetAdviceAsync(commute.Id);

        Assert.Equal("leave", advice.Status);
        Assert.Equal("154", advice.Departure?.Route);
        Assert.Equal(Utc(17, 24, 25), advice.Departure?.PredictedTime);
        Assert.Equal(Utc(17, 18, 25), advice.LeaveBy);
        Assert.Equal(3, advice.LeaveInMinutes);
    }

    [Fact]
    public async Task Advice_SkipsDeparturesThatAreTooLateToCatch()
    {
        // At 17:20 the leaveBy times of routes 154 and 186 (17:18) are already in the past.
        _factory.Now = Utc(17, 20, 0);
        var commute = await CreateCommuteAsync(route: null);

        var advice = await GetAdviceAsync(commute.Id);

        Assert.Equal("208", advice.Departure?.Route);
        Assert.Equal(Utc(17, 34, 0), advice.LeaveBy);
        Assert.Equal(14, advice.LeaveInMinutes);
    }

    [Fact]
    public async Task Advice_WithRoute_OnlyConsidersThatRoute()
    {
        _factory.Now = Utc(17, 15, 0);
        var commute = await CreateCommuteAsync(route: "186");

        var advice = await GetAdviceAsync(commute.Id);

        Assert.Equal("186", advice.Departure?.Route);
        Assert.Equal(Utc(17, 18, 26), advice.LeaveBy);
        Assert.Equal(3, advice.LeaveInMinutes);
    }

    [Fact]
    public async Task Advice_RouteDoesNotStopHere_ReturnsNoDeparture()
    {
        _factory.Now = Utc(17, 15, 0);
        var commute = await CreateCommuteAsync(route: "999");

        var advice = await GetAdviceAsync(commute.Id);

        Assert.Equal(new AdviceResponse("noDeparture", null, null, null), advice);
    }

    [Fact]
    public async Task Advice_EveryDepartureIsTooLate_ReturnsNoDeparture()
    {
        _factory.Now = Utc(17, 50, 0);
        var commute = await CreateCommuteAsync(route: null);

        var advice = await GetAdviceAsync(commute.Id);

        Assert.Equal(new AdviceResponse("noDeparture", null, null, null), advice);
    }

    [Fact]
    public async Task Advice_StopHasNoDepartures_ReturnsNoDeparture()
    {
        _factory.ZtmHandler = FakeHttpHandler.Returning("");
        var commute = await CreateCommuteAsync(route: null);

        var advice = await GetAdviceAsync(commute.Id);

        Assert.Equal(new AdviceResponse("noDeparture", null, null, null), advice);
    }

    [Fact]
    public async Task Json_UsesCamelCase()
    {
        _factory.Now = Utc(17, 15, 0);
        var commute = await CreateCommuteAsync(route: null);

        var json = await _factory.CreateClient().GetStringAsync($"/api/commutes/{commute.Id}/advice");

        Assert.Contains("\"status\":\"leave\"", json);
        Assert.Contains("\"leaveBy\":\"2026-11-14T17:18:25Z\"", json);
        Assert.Contains("\"leaveInMinutes\":3", json);
    }

    [Fact]
    public async Task UnknownCommute_Returns404ProblemDetails()
    {
        var response = await _factory.CreateClient().GetAsync($"/api/commutes/{Guid.NewGuid()}/advice");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task WhenZtmIsDown_Returns503ProblemDetails()
    {
        _factory.ZtmHandler = FakeHttpHandler.Returning("down", HttpStatusCode.InternalServerError);
        var commute = await CreateCommuteAsync(route: null);

        var response = await _factory.CreateClient().GetAsync($"/api/commutes/{commute.Id}/advice");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    private async Task<CommuteResponse> CreateCommuteAsync(string? route)
    {
        var request = new CommuteRequest("Home to work", 1016, route, WalkMinutes);
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/commutes", request);
        return (await response.Content.ReadFromJsonAsync<CommuteResponse>())!;
    }

    private async Task<AdviceResponse> GetAdviceAsync(Guid commuteId)
    {
        var url = $"/api/commutes/{commuteId}/advice";
        return (await _factory.CreateClient().GetFromJsonAsync<AdviceResponse>(url))!;
    }

    private static DateTime Utc(int hour, int minute, int second)
    {
        return new DateTime(2026, 11, 14, hour, minute, second, DateTimeKind.Utc);
    }
}
