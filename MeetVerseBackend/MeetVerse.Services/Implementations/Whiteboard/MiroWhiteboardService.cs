using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Shared.Common;
using MeetVerse.Shared.Configuration;

namespace MeetVerse.Services.Implementations.Whiteboard;

public class MiroWhiteboardService : IMiroWhiteboardService
{
    private readonly HttpClient _httpClient;

    public MiroWhiteboardService(HttpClient httpClient, IOptions<MiroSettings> options)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(options.Value.BaseUrl.TrimEnd('/') + "/");
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", options.Value.AccessToken);
        _httpClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<MiroBoardResult> CreateBoardAsync(string name, string? description = null)
    {
        var body = new
        {
            name,
            description = description ?? "",
            policy = new
            {
                sharingPolicy = new
                {
                    access = "private",
                    teamAccess = "edit"
                }
            }
        };

        var json = JsonSerializer.Serialize(body);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("boards", content);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(responseJson);
        var root = doc.RootElement;

        return new MiroBoardResult
        {
            Id = root.GetProperty("id").GetString()!,
            ViewLink = root.GetProperty("viewLink").GetString()!,
            Name = root.GetProperty("name").GetString()!
        };
    }

    public async Task<MiroBoardResult?> GetBoardAsync(string boardId)
    {
        var response = await _httpClient.GetAsync($"boards/{boardId}");
        if (!response.IsSuccessStatusCode) return null;

        var responseJson = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(responseJson);
        var root = doc.RootElement;

        return new MiroBoardResult
        {
            Id = root.GetProperty("id").GetString()!,
            ViewLink = root.GetProperty("viewLink").GetString()!,
            Name = root.GetProperty("name").GetString()!
        };
    }

    public async Task<bool> DeleteBoardAsync(string boardId)
    {
        var response = await _httpClient.DeleteAsync($"boards/{boardId}");
        return response.IsSuccessStatusCode;
    }
}
