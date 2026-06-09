using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using MeetVerse.Abstraction.Commands;
using MeetVerse.Abstraction.IServices;
using MeetVerse.Domain.Entities;
using MeetVerse.Domain.Specifications;
using MeetVerse.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using MeetVerse.Shared.DTOs.Profile;

namespace MeetVerse.Services.Implementations.Profile;

public class UploadAvatarCommandHandler : IRequestHandler<UploadAvatarCommand, UserProfileDto>
{
    private readonly MeetVerseDbContext _db;
    private readonly IImageStorageService _imageStorageService;
    private readonly IImageResolver _imageResolver;
    private readonly IMapper _mapper;

    public UploadAvatarCommandHandler(
        MeetVerseDbContext db,
        IImageStorageService imageStorageService,
        IImageResolver imageResolver,
        IMapper mapper)
    {
        _db = db;
        _imageStorageService = imageStorageService;
        _imageResolver = imageResolver;
        _mapper = mapper;
    }

    public async Task<UserProfileDto> Handle(UploadAvatarCommand request, CancellationToken cancellationToken)
    {
        // 1. Fetch user using the UserByIdSpecification
        var spec = new UserByIdSpecification(request.UserId);
        var user = await SpecificationEvaluator.GetQuery(_db.Users, spec)
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            throw new System.Exception("User not found.");
        }

        // 2. Delete any previous avatar file to prevent orphan files on disk
        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            await _imageStorageService.DeleteImageAsync(user.AvatarUrl);
        }

        // 3. Save the new avatar image
        var relativePath = await _imageStorageService.SaveImageAsync(request.FileStream, request.Username, request.FileName);

        // 4. Update the user entity and save to DB
        user.AvatarUrl = relativePath;
        await _db.SaveChangesAsync(cancellationToken);

        // 5. Map to UserProfileDto and resolve full URL
        var resultDto = _mapper.Map<UserProfileDto>(user);
        resultDto.AvatarUrl = _imageResolver.ResolveAvatarUrl(user.AvatarUrl);

        return resultDto;
    }
}
