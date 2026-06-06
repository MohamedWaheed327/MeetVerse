using System.Linq;
using MeetVerse.Domain.Contracts;
using Microsoft.EntityFrameworkCore;

namespace MeetVerse.Persistence.Data;

public static class SpecificationEvaluator
{
    public static IQueryable<TEntity> GetQuery<TEntity>(IQueryable<TEntity> inputQuery, ISpecification<TEntity> spec) where TEntity : class
    {
        var query = inputQuery;
        if (spec.Criteria != null)
        {
            query = query.Where(spec.Criteria);
        }
        query = spec.Includes.Aggregate(query, (current, include) => current.Include(include));
        return query;
    }
}
