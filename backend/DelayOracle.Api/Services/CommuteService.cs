using DelayOracle.Api.Data;
using DelayOracle.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DelayOracle.Api.Services;

public class CommuteService
{
    private readonly AppDbContext _db;

    public CommuteService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<CommuteResponse> CreateAsync(CommuteRequest commuteRequest, CancellationToken cancellationToken)
    {
        var commute = new Commute
        {
            Name = commuteRequest.Name,
            StopId = commuteRequest.StopId,
            RouteShortName = commuteRequest.RouteShortName,
            WalkMinutes = commuteRequest.WalkMinutes,
            CreatedAt = DateTime.UtcNow
        };

        _db.Commutes.Add(commute);
        await _db.SaveChangesAsync(cancellationToken);

        return ToResponse(commute);
    }

    public async Task<List<CommuteResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        var commutes = await _db.Commutes.ToListAsync(cancellationToken);

        return commutes.Select(ToResponse).ToList();
    }

    public async Task<CommuteResponse?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var commute = await _db.Commutes.FindAsync([id], cancellationToken);

        return commute == null ? null : ToResponse(commute);
    }

    public async Task<CommuteResponse?> UpdateAsync(int id, CommuteRequest commuteRequest, CancellationToken cancellationToken)
    {
        var commute = await _db.Commutes.FindAsync([id], cancellationToken);
        if (commute == null)
        {
            return null;
        }
        else
        {
            commute.Name = commuteRequest.Name;
            commute.RouteShortName = commuteRequest.RouteShortName;
            commute.StopId = commuteRequest.StopId;
            commute.WalkMinutes = commuteRequest.WalkMinutes;

            await _db.SaveChangesAsync(cancellationToken);

            return ToResponse(commute);
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var deletedRows = await _db.Commutes.Where(i => i.Id == id).ExecuteDeleteAsync(cancellationToken);
        return deletedRows > 0;
    }

    private static CommuteResponse ToResponse(Commute commute)
    {
        return new CommuteResponse(
            commute.Id,
            commute.Name,
            commute.StopId,
            commute.RouteShortName,
            commute.WalkMinutes,
            commute.CreatedAt
        );
    }
}