using System.Net;
using System.Net.Http.Json;
using DelayOracle.Api.Models;

namespace DelayOracle.Tests;

// The fake ZTM answers with Fixtures/ztm-stops.json: two days that share some stops,
// and one stop without a name on each day.
public class StopsEndpointTests : IDisposable
{
    private readonly ApiFactory _factory = new();

    public void Dispose()
    {
        _factory.Dispose();
    }

    [Fact]
    public async Task Search_ReturnsMatchingStopsOnceEachSortedByNameThenCode()
    {
        var stops = await SearchAsync("dworzec");

        Assert.Equal(
            [
                new StopResponse(1014, "Dworzec Główny", "05", "Gdańsk"),
                new StopResponse(1013, "Dworzec Główny", "18", "Gdańsk"),
            ],
            stops);
    }

    [Theory]
    [InlineData("wyzynna")]
    [InlineData("Wyżynna")]
    [InlineData("BRAMA WYZ")]
    public async Task Search_IgnoresCaseAndPolishMarks(string query)
    {
        var stops = await SearchAsync(query);

        // Both are "Brama Wyżynna"; stop 1030 has code 03 and stop 1028 has code 05.
        Assert.Equal([1030, 1028], stops.Select(stop => stop.Id));
    }

    [Fact]
    public async Task Search_FindsStopsFromEveryDay()
    {
        var stops = await SearchAsync("zaspa");

        Assert.Equal(["Zaspa", "Zaspa SKM"], stops.Select(stop => stop.Name));
    }

    [Fact]
    public async Task Search_NoMatch_ReturnsEmptyList()
    {
        var stops = await SearchAsync("nie ma takiego");

        Assert.Empty(stops);
    }

    [Theory]
    [InlineData("/api/stops")]
    [InlineData("/api/stops?query=")]
    [InlineData("/api/stops?query=a")]
    public async Task Search_MissingOrTooShortQuery_Returns400(string url)
    {
        var response = await _factory.CreateClient().GetAsync(url);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Search_WhenZtmIsDown_Returns503ProblemDetails()
    {
        _factory.ZtmHandler = FakeHttpHandler.Returning("down", HttpStatusCode.InternalServerError);

        var response = await _factory.CreateClient().GetAsync("/api/stops?query=dworzec");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetById_KnownStop_ReturnsTheStop()
    {
        var stop = await _factory.CreateClient().GetFromJsonAsync<StopResponse>("/api/stops/1028");

        Assert.Equal(new StopResponse(1028, "Brama Wyżynna", "05", "Gdańsk"), stop);
    }

    [Fact]
    public async Task GetById_UnknownStop_Returns404ProblemDetails()
    {
        var response = await _factory.CreateClient().GetAsync("/api/stops/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetById_WhenZtmIsDown_Returns503ProblemDetails()
    {
        _factory.ZtmHandler = FakeHttpHandler.Returning("down", HttpStatusCode.InternalServerError);

        var response = await _factory.CreateClient().GetAsync("/api/stops/1028");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    private async Task<List<StopResponse>> SearchAsync(string query)
    {
        var url = $"/api/stops?query={Uri.EscapeDataString(query)}";
        return (await _factory.CreateClient().GetFromJsonAsync<List<StopResponse>>(url))!;
    }
}
