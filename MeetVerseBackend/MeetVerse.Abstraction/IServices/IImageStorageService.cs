using System.IO;
using System.Threading.Tasks;

namespace MeetVerse.Abstraction.IServices;

public interface IImageStorageService
{
    Task<string> SaveImageAsync(Stream fileStream, string username, string originalFileName);
    Task DeleteImageAsync(string relativePath);
}
