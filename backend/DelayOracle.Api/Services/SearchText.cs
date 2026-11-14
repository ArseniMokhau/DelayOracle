using System.Globalization;
using System.Text;

namespace DelayOracle.Api.Services;

public static class SearchText
{
    public static string Normalize(string text)
    {
        var preprocessedText = text.Trim().ToLowerInvariant().Replace("ł", "l").Normalize(NormalizationForm.FormD);

        StringBuilder processedText = new();

        foreach (char ch in preprocessedText)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            {
                processedText.Append(ch);
            }
        }
        return processedText.ToString();
    }
}