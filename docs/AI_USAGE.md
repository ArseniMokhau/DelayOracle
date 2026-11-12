# AI usage log

A record of how AI tools were used on this project. The README's "AI usage" section summarises this file.

## Tools

- **Claude (chat):** feasibility research, throwaway spikes.
- **Claude Code:** implementation, review and commit hygiene inside the repository, configured through `AGENTS.md`, `CLAUDE.md` and `.claude/`.

## Milestone 0: idea, data feasibility, spikes (November 2026)

**What was done**

- Searched the web for free training data, ZTM Gdańsk was local and keyless, so DelayOracle was chosen as project.
- Wrote six throwaway feasibility spikes (data source, collection, weather, Python worker, .NET API with queue and CORS, React) and a collector.

**What had to be corrected**

- The legacy `delays` endpoint no longer exists (HTTP 404); only `departures` works.
- The first spike picked the first five stops, many with no departures; it now picks active stops.
- `tripId` is not unique; the trip identifier is `trip`.
- The first collector design stored every sighting, repeating each departure; it now stores one row per departure.

## Template for later milestones

```
## Milestone N: title (month year)
**What Claude did** …
**What had to be corrected** …
**What was done by hand** …
```
