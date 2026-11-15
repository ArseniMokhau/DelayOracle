using DelayOracle.Api.Services;

namespace DelayOracle.Tests;

// Stop names are compared after normalising, so a search works without Polish letters.
public class SearchTextTests
{
    [Theory]
    [InlineData("Dworzec", "dworzec")]
    [InlineData("Brama Wyżynna", "brama wyzynna")]
    [InlineData("Dworzec Główny", "dworzec glowny")]
    [InlineData("ŁĄKOWA", "lakowa")]
    [InlineData("Zaśnięcia Żółć Dęby", "zasniecia zolc deby")]
    [InlineData("  Zaspa  ", "zaspa")]
    public void Normalize_LowercasesTrimsAndRemovesPolishMarks(string input, string expected)
    {
        Assert.Equal(expected, SearchText.Normalize(input));
    }
}
