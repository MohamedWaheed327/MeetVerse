using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MeetVerse.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task SendMessage(Guid meetingId, string message)
    {
        await Clients.Group(meetingId.ToString()).SendAsync("ReceiveMessage", Context.UserIdentifier, message);
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public Task JoinMeetingGroup(Guid meetingId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, meetingId.ToString());
    }
}


