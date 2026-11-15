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

## Milestone 2: commutes API (November 2026)

The developer wrote the implementation. Claude assisted with testing and with implementation suggestions.

**What Claude did**

- Testing: wrote the in-memory SQLite test factory (`ApiFactory`) and the commutes endpoint tests for every status code in the API table.
- Implementation suggestions: proposed the order of the steps and the approach for each one (entity, `AppDbContext`, DTOs with validation, service, controller).
- Setup: EF Core packages, the local `dotnet-ef` tool, and applying migrations on startup.

**What had to be corrected**

- Claude's first suggestion for `CommuteService` was not detailed enough and had to be expanded.

## Milestone 3: advice rule (November 2026)

The developer wrote the implementation. Claude assisted with testing and with implementation suggestions.

**What Claude did**

- Testing: wrote the `AdviceCalculator` unit tests for the five examples in the architecture document, plus unsorted input, partial minutes and a `leaveBy` just in the past.
- Implementation suggestions: proposed the method signature (the current time passed in as a parameter, `null` for no departure) and the steps of the rule.

**What had to be corrected**

- Claude's first set of tests missed a case: a `leaveBy` less than a minute in the past rounds to zero minutes and could be reported as "leave now". A test for it was added.

## Milestone 4: live departures (November 2026)

The developer wrote the implementation. Claude assisted with testing and with implementation suggestions.

**What Claude did**

- Testing: wrote a fake ZTM (`FakeHttpHandler`) with fixtures in the shape of the real responses, a replaceable clock in the test factory, and the tests for the ZTM client, stop search, departures and advice endpoints.
- Setup: ZTM settings in configuration, the typed `HttpClient` registration, and the exception handler that turns a ZTM failure into a 503 ProblemDetails.
- Ran the API against live ZTM for one real stop (search, departures, advice).

**What had to be corrected**

- One of Claude's stop search tests expected the wrong order for two stops with the same name; it was fixed before it was used.
- Claude's Milestone 2 tests compared `createdAt` values in a way that ignores whether the time is marked as UTC, so they missed that the `Z` was lost when a commute was read back from SQLite. A test on the raw JSON was added and the bug fixed.

## Milestone 5: prediction worker (November 2026)

The developer wrote the worker endpoints and the API integration. Claude assisted with testing and with implementation suggestions, and for the training script provided the code in explained parts as a PyTorch refresher, which the developer typed and ran.

**What Claude did**

- Testing: wrote the tests for the feature builder, the collector, the worker endpoints, the API's worker client, the predicted departures and the model endpoint, with a fake worker for the API tests.
- Training: provided the PyTorch training code part by part (loading, network, training loop, evaluation, saving) with explanations; wrote the feature builder shared by training and serving.
- Collector: made it pass the linter and changed it to store every sighting of a departure.
- Analysis: probed the trained model with inputs outside the collected days and compared feature sets on the test rows.
- Setup: CPU-only PyTorch, worker settings and the 503 handler in the API, Compose configuration; ran the API with the real worker locally and in Docker.

**What had to be corrected**

- Claude's first plan trained on six features including weekday and weather. Probing showed that model gave wrong predictions for other weekdays and temperatures (for example over 20 minutes of delay at 20 °C), which the test score had not revealed. The model was reduced to three features, and the weather download script Claude had written was removed.
- Claude first said an extra filter for impossible delays was needed; the existing "usable label" rule already excluded them.
- The architecture document described a `/predict` contract where the API computed the features; Claude changed it so the worker builds them in one place.

## Template for later milestones

```
## Milestone N: title (month year)
**What Claude did** …
**What had to be corrected** …
```
