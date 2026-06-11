using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using System.Net.WebSockets;
using System.Text;

using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;

namespace MeetVerse.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DeepGramController : ControllerBase
{
    private readonly IConfiguration _config;

    public DeepGramController(IConfiguration config) { _config = config; }

    static string? SimplifyDeepgramMessage(string rawJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;
            if (!root.TryGetProperty("type", out var typeProp)) return null;
            if (typeProp.GetString() != "Results") return null;
            if (!root.TryGetProperty("channel", out var channelProp)) return null;
            if (!channelProp.TryGetProperty("alternatives", out var alternativesProp)) return null;
            if (alternativesProp.GetArrayLength() == 0) return null;
            var firstAlt = alternativesProp[0];
            var transcript = firstAlt.GetProperty("transcript").GetString() ?? "";
            if (string.IsNullOrWhiteSpace(transcript)) return null;
            var isFinal = root.TryGetProperty("is_final", out var isFinalProp) && isFinalProp.GetBoolean();
            var speechFinal = root.TryGetProperty("speech_final", out var speechFinalProp) && speechFinalProp.GetBoolean();
            return JsonSerializer.Serialize(new { type = "transcript", text = transcript, isFinal, speechFinal });
        }
        catch { return null; }
    }

    class SocketMessage
    {
        public WebSocketMessageType MessageType { get; set; }
        public byte[] Data { get; set; } = Array.Empty<byte>();
        public WebSocketCloseStatus? CloseStatus { get; set; }
        public string? CloseStatusDescription { get; set; }
    }

    static async Task<SocketMessage> ReceiveMessageAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var buffer = new byte[8192];
        using var ms = new MemoryStream();
        while (true)
        {
            var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);
            if (result.MessageType == WebSocketMessageType.Close)
                return new SocketMessage { MessageType = WebSocketMessageType.Close, Data = Array.Empty<byte>(), CloseStatus = result.CloseStatus, CloseStatusDescription = result.CloseStatusDescription };
            if (result.Count > 0) ms.Write(buffer, 0, result.Count);
            if (result.EndOfMessage) return new SocketMessage { MessageType = result.MessageType, Data = ms.ToArray() };
        }
    }

    [AllowAnonymous]
    [HttpGet("/ws/transcribe")]
    public async Task Transcripe()
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("Expected WebSocket request.");
            return;
        }
        using var browserSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        using var deepgramSocket = new ClientWebSocket();
        deepgramSocket.Options.SetRequestHeader("Authorization", $"Token {_config["Deepgram:ApiKey"]}");
        var deepgramUri = new Uri("wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true&interim_results=true&keepalive=true");
        await deepgramSocket.ConnectAsync(deepgramUri, CancellationToken.None);
        var cts = new CancellationTokenSource();

        var browserToDeepgram = Task.Run(async () =>
        {
            try
            {
                while (browserSocket.State == WebSocketState.Open && deepgramSocket.State == WebSocketState.Open && !cts.Token.IsCancellationRequested)
                {
                    var message = await ReceiveMessageAsync(browserSocket, cts.Token);
                    if (message.MessageType == WebSocketMessageType.Close)
                    {
                        if (deepgramSocket.State == WebSocketState.Open)
                            await deepgramSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Browser closed", CancellationToken.None);
                        break;
                    }
                    if (message.MessageType == WebSocketMessageType.Binary && message.Data.Length > 0)
                        await deepgramSocket.SendAsync(new ArraySegment<byte>(message.Data), WebSocketMessageType.Binary, true, cts.Token);
                }
            }
            catch { cts.Cancel(); }
        });

        var deepgramToBrowser = Task.Run(async () =>
        {
            try
            {
                while (browserSocket.State == WebSocketState.Open && deepgramSocket.State == WebSocketState.Open && !cts.Token.IsCancellationRequested)
                {
                    var message = await ReceiveMessageAsync(deepgramSocket, cts.Token);
                    if (message.MessageType == WebSocketMessageType.Close)
                    {
                        if (browserSocket.State == WebSocketState.Open)
                            await browserSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Deepgram closed", CancellationToken.None);
                        break;
                    }
                    if (message.MessageType == WebSocketMessageType.Text)
                    {
                        var rawJson = Encoding.UTF8.GetString(message.Data);
                        var simplified = SimplifyDeepgramMessage(rawJson);
                        if (!string.IsNullOrWhiteSpace(simplified) && browserSocket.State == WebSocketState.Open)
                        {
                            var bytes = Encoding.UTF8.GetBytes(simplified);
                            await browserSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, cts.Token);
                        }
                    }
                }
            }
            catch { cts.Cancel(); }
        });

        await Task.WhenAny(browserToDeepgram, deepgramToBrowser);
        cts.Cancel();
        if (browserSocket.State == WebSocketState.Open)
            await browserSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Session ended", CancellationToken.None);
    }
}
