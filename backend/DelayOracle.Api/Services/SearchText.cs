using System.Globalization;
using System.Text;

namespace DelayOracle.Api.Services;

// Makes stop names comparable, so "wyzynna" finds "Brama Wyżynna".
public static class SearchText
{
    public static string Normalize(string text)
    {
        // FormD splits a letter such as "ż" into "z" plus a separate accent mark, which the loop
        // below drops. "ł" has no such split, so it is replaced by hand.
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