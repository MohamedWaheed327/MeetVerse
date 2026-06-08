using MeetVerse.Shared.Common;

namespace MeetVerse.Abstraction.IServices;

public interface IMiroWhiteboardService
{
    Task<MiroBoardResult> CreateBoardAsync(string name, string? description = null);
    Task<MiroBoardResult?> GetBoardAsync(string boardId);
    Task<bool> DeleteBoardAsync(string boardId);
}
