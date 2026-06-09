using System;
using MeetVerse.Domain.Contracts;
using MeetVerse.Domain.Entities;

namespace MeetVerse.Domain.Specifications;

public class UserByIdSpecification : BaseSpecification<User>
{
    public UserByIdSpecification(Guid id) : base(u => u.Id == id)
    {
    }
}
