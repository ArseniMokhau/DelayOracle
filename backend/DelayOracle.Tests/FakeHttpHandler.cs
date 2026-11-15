using System.Net;
using System.Text;

namespace DelayOracle.Tests;

// Stands in for the network: an HttpClient built on this handler never leaves the test process.
public class FakeHttpHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;

    public FakeHttpHandler(Func<HttpRequestMessage, HttpResponseMessage> respond)
    {
        _respond = respond;
    }

    public List<string> RequestedUrls { get; } = [];

    public static FakeHttpHandler Returning(string body, HttpStatusCode status = HttpStatusCode.OK)
    {
        return new FakeHttpHandler(_ => new HttpResponseMessage(status)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        });
    }

    public static FakeHttpHandler Throwing(Exception exception)
    {
        return new FakeHttpHandler(_ => throw exception);
    }

    public static string Fixture(string fileName)
    {
        return File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", fileName));
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        RequestedUrls.Add(request.RequestUri!.ToString());
        return Task.FromResult(_respond(request));
    }
}
