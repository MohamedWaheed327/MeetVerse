using System.Net.Http.Headers;
using System.Text.Json;

namespace MeetVerse.Api.Services;

public record GitHubUserInfo(string Email, string Name, string? AvatarUrl);

public interface IGitHubOAuthService
{
    Task<GitHubUserInfo?> ExchangeCodeForUserAsync(string code, CancellationToken cancellationToken = default);
}

public class GitHubOAuthService : IGitHubOAuthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public GitHubOAuthService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<GitHubUserInfo?> ExchangeCodeForUserAsync(string code, CancellationToken cancellationToken = default)
    {
        var clientId = _configuration["GitHubAuth:ClientId"];
        var clientSecret = _configuration["GitHubAuth:ClientSecret"];
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return null;
        }

        var token = await ExchangeCodeForTokenAsync(code, clientId, clientSecret, cancellationToken);
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var (name, avatarUrl, emailFromProfile) = await GetUserProfileAsync(token, cancellationToken);
        var email = emailFromProfile;
        if (string.IsNullOrWhiteSpace(email))
        {
            email = await GetPrimaryEmailAsync(token, cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var resolvedName = string.IsNullOrWhiteSpace(name) ? email.Split('@')[0] : name;
        return new GitHubUserInfo(email, resolvedName, avatarUrl);
    }

    private async Task<string?> ExchangeCodeForTokenAsync(string code, string clientId, string clientSecret, CancellationToken cancellationToken)
    {
        using var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token")
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["code"] = code
            })
        };
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.UserAgent.ParseAdd("MeetVerse");

        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        using var json = JsonDocument.Parse(content);
        return json.RootElement.TryGetProperty("access_token", out var accessTokenElement)
            ? accessTokenElement.GetString()
            : null;
    }

    private async Task<(string? Name, string? AvatarUrl, string? Email)> GetUserProfileAsync(string accessToken, CancellationToken cancellationToken)
    {
        using var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.UserAgent.ParseAdd("MeetVerse");

        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return (null, null, null);
        }

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        using var json = JsonDocument.Parse(content);
        var root = json.RootElement;

        var name = root.TryGetProperty("name", out var nameElement) ? nameElement.GetString() : null;
        var avatarUrl = root.TryGetProperty("avatar_url", out var avatarElement) ? avatarElement.GetString() : null;
        var email = root.TryGetProperty("email", out var emailElement) ? emailElement.GetString() : null;
        return (name, avatarUrl, email);
    }

    private async Task<string?> GetPrimaryEmailAsync(string accessToken, CancellationToken cancellationToken)
    {
        using var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.UserAgent.ParseAdd("MeetVerse");

        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        using var json = JsonDocument.Parse(content);
        if (json.RootElement.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        string? fallbackVerified = null;
        foreach (var emailItem in json.RootElement.EnumerateArray())
        {
            var email = emailItem.TryGetProperty("email", out var emailElement)
                ? emailElement.GetString()
                : null;
            var primary = emailItem.TryGetProperty("primary", out var primaryElement)
                && primaryElement.GetBoolean();
            var verified = emailItem.TryGetProperty("verified", out var verifiedElement)
                && verifiedElement.GetBoolean();

            if (verified && primary && !string.IsNullOrWhiteSpace(email))
            {
                return email;
            }

            if (verified && !string.IsNullOrWhiteSpace(email))
            {
                fallbackVerified ??= email;
            }
        }

        return fallbackVerified;
    }
}
