using System;
using System.IO;
using MediatR;
using MeetVerse.Shared.DTOs.Profile;

namespace MeetVerse.Abstraction.Commands;

public record UploadAvatarCommand(Guid UserId, string Username, Stream FileStream, string FileName) : IRequest<UserProfileDto>;
