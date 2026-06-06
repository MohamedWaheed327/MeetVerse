using AutoMapper;
using MeetVerse.Domain.Entities;
using MeetVerse.Shared.DTOs.Profile;

namespace MeetVerse.Abstraction.Mapping;

public class ProfileMappingProfile : Profile
{
    public ProfileMappingProfile()
    {
        CreateMap<User, UserProfileDto>()
            .MaxDepth(64)
            .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.Roles.ToString()))
            .ForMember(dest => dest.IsGoogleUser, opt => opt.MapFrom(src => string.IsNullOrEmpty(src.PasswordHash)));
    }
}
