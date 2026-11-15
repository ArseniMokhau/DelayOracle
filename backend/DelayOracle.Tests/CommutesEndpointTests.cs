using System.Net;
using System.Net.Http.Json;
using DelayOracle.Api.Models;

namespace DelayOracle.Tests;

// xUnit creates a new instance of this class for every test, so each test gets an empty database.
public class CommutesEndpointTests : IDisposable
{
    private static readonly CommuteRequest ValidRequest = new("Home to work", 1234, "8", 5);

    private readonly ApiFactory _factory = new();
    private readonly HttpClient _client;

    public CommutesEndpointTests()
    {
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _factory.Dispose();
    }

    [Fact]
    public async Task Post_ValidCommute_Returns201WithLocationAndBody()
    {
        var response = await _client.PostAsJsonAsync("/api/commutes", ValidRequest);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<CommuteResponse>();
        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("Home to work", created.Name);
        Assert.Equal(1234, created.StopId);
        Assert.Equal("8", created.RouteShortName);
        Assert.Equal(5, created.WalkMinutes);
        Assert.EndsWith($"/api/commutes/{created.Id}", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task GetById_ExistingCommute_Returns200()
    {
        var created = await CreateCommuteAsync();

        var response = await _client.GetAsync($"/api/commutes/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var fetched = await response.Content.ReadFromJsonAsync<CommuteResponse>();
        Assert.Equal(created, fetched);
    }

    [Fact]
    public async Task Post_EveryCommuteGetsItsOwnId()
    {
        var first = await CreateCommuteAsync();
        var second = await CreateCommuteAsync();

        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public async Task GetByIds_ReturnsOnlyTheRequestedCommutesOldestFirst()
    {
        var first = await CreateCommuteAsync();
        await CreateCommuteAsync();
        var third = await CreateCommuteAsync();

        var commutes = await _client.GetFromJsonAsync<List<CommuteResponse>>(
            $"/api/commutes?ids={third.Id}&ids={first.Id}");

        Assert.NotNull(commutes);
        Assert.Equal([first, third], commutes);
    }

    [Fact]
    public async Task GetByIds_UnknownIdIsLeftOut()
    {
        var created = await CreateCommuteAsync();

        var commutes = await _client.GetFromJsonAsync<List<CommuteResponse>>(
            $"/api/commutes?ids={created.Id}&ids={Guid.NewGuid()}");

        Assert.NotNull(commutes);
        Assert.Equal([created], commutes);
    }

    [Fact]
    public async Task Get_WithoutIds_ReturnsAnEmptyList()
    {
        // The id is the only key to a commute, so the API never lists commutes nobody asked for.
        await CreateCommuteAsync();

        var commutes = await _client.GetFromJsonAsync<List<CommuteResponse>>("/api/commutes");

        Assert.NotNull(commutes);
        Assert.Empty(commutes);
    }

    [Fact]
    public async Task GetByIds_MalformedId_Returns400()
    {
        var response = await _client.GetAsync("/api/commutes?ids=not-a-guid");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetById_CreatedAtIsMarkedAsUtc()
    {
        var created = await CreateCommuteAsync();

        var json = await _client.GetStringAsync($"/api/commutes/{created.Id}");

        // Without the Z a browser would read the time as local time.
        Assert.Matches("\"createdAt\":\"[^\"]+Z\"", json);
    }

    [Fact]
    public async Task GetById_UnknownId_Returns404()
    {
        var response = await _client.GetAsync($"/api/commutes/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_IdThatIsNotAGuid_Returns404()
    {
        var response = await _client.GetAsync("/api/commutes/999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    public static TheoryData<CommuteRequest> InvalidRequests => new()
    {
        ValidRequest with { Name = "" },
        ValidRequest with { Name = new string('x', 61) },
        ValidRequest with { StopId = 0 },
        ValidRequest with { RouteShortName = "123456789" },
        ValidRequest with { WalkMinutes = -1 },
        ValidRequest with { WalkMinutes = 61 },
    };

    [Theory]
    [MemberData(nameof(InvalidRequests))]
    public async Task Post_InvalidCommute_Returns400(CommuteRequest invalidRequest)
    {
        var response = await _client.PostAsJsonAsync("/api/commutes", invalidRequest);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Put_ExistingCommute_Returns200AndReplacesFields()
    {
        var created = await CreateCommuteAsync();
        var replacement = new CommuteRequest("Home to gym", 2000, null, 10);

        var response = await _client.PutAsJsonAsync($"/api/commutes/{created.Id}", replacement);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<CommuteResponse>();
        var expected = new CommuteResponse(created.Id, "Home to gym", 2000, null, 10, created.CreatedAt);
        Assert.Equal(expected, updated);
        var fetched = await _client.GetFromJsonAsync<CommuteResponse>($"/api/commutes/{created.Id}");
        Assert.Equal(expected, fetched);
    }

    [Fact]
    public async Task Put_UnknownId_Returns404()
    {
        var response = await _client.PutAsJsonAsync($"/api/commutes/{Guid.NewGuid()}", ValidRequest);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_InvalidCommute_Returns400()
    {
        var created = await CreateCommuteAsync();

        var response = await _client.PutAsJsonAsync(
            $"/api/commutes/{created.Id}", ValidRequest with { WalkMinutes = 61 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ExistingCommute_Returns204AndRemovesIt()
    {
        var created = await CreateCommuteAsync();

        var response = await _client.DeleteAsync($"/api/commutes/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var afterDelete = await _client.GetAsync($"/api/commutes/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, afterDelete.StatusCode);
    }

    [Fact]
    public async Task Delete_UnknownId_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/commutes/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<CommuteResponse> CreateCommuteAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/commutes", ValidRequest);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CommuteResponse>())!;
    }
}
