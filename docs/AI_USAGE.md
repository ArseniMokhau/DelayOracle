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

## Milestone 1: skeleton (November 2026)

**What Claude did**

- Proposed a plan and waited for approval before creating files.
- Scaffolded the backend (`dotnet new`), frontend (`npm create vite`) and worker, each with a health endpoint or status page and a test.
- Added Dockerfiles, `docker-compose.yml`, the CI workflow and the README; ran build, tests, lint and a Docker smoke test.

**What had to be corrected**

- `dotnet add package` picked .NET 11 versions that do not support .NET 10; `Microsoft.AspNetCore.Mvc.Testing` was pinned to `10.0.*`.
- The full `Swashbuckle.AspNetCore` package conflicted with the built-in `Microsoft.AspNetCore.OpenApi`; only `Swashbuckle.AspNetCore.SwaggerUI` is used, on top of the built-in OpenAPI document.
- The docs said `DelayOracle.sln` and Python 3.12; they now say `DelayOracle.slnx` (the .NET 10 default) and Python 3.14.

## Template for later milestones

```
## Milestone N: title (month year)
**What Claude did** …
**What had to be corrected** …
```
