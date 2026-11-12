# AGENTS.md

Shared rules for every AI coding tool (Claude Code, Cursor, Copilot) and for humans. Claude Code loads this file through `CLAUDE.md`.

## Project

DelayOracle tells a user when to leave home to catch public transport in Gdańsk. It combines live ZTM Gdańsk departures, a delay prediction from a trained model, and the user's walking time to the stop. Design: `docs/ARCHITECTURE.md`.

## Quality bar

| Criterion | What it means in this repo |
|---|---|
| Architecture and organisation | `backend/`, `ai-worker/` and `frontend/` are separate folders; inside the backend, folders separate HTTP, logic, models and data |
| Code quality and readability | Small functions, clear names, no dead code; the same standard in C#, Python and TypeScript |
| API design | Resource-oriented REST, correct status codes, ProblemDetails errors, working CORS |
| UX/UI | Intuitive and responsive; loading, empty and error states on every screen |

## Commands

| Part | Command |
|---|---|
| Backend build / test | `dotnet build backend/DelayOracle.slnx` / `dotnet test backend/DelayOracle.slnx` |
| Backend run | `dotnet run --project backend/DelayOracle.Api --urls http://localhost:5000` |
| Worker setup / test | `cd ai-worker && pip install -r requirements.txt` / `pytest` |
| Worker lint | `ruff check .` |
| Worker run | `uvicorn app:app --port 8000` |
| Worker train | `python train.py` |
| Collect data | `python collector.py` (add `--report` to inspect) |
| Frontend setup / run | `cd frontend && npm ci` / `npm run dev` (http://localhost:5173) |
| Frontend checks | `npm run lint`, `npm test -- --run`, `npm run build` |
| Everything | `docker compose up --build` |

The development machine is Windows with PowerShell. In PowerShell `curl` is an alias that mangles JSON quoting; document `curl.exe` or `Invoke-RestMethod` instead.

## Backend rules (C#)

- Current .NET LTS, nullable reference types on, warnings are errors in CI.
- Folders are the layers: `Controllers` (HTTP only), `Services` (logic and outside calls), `Models` (entity and DTO records), `Data` (EF Core). Controllers call services, hold no business logic and never return entities.
- Business rules are plain methods without I/O (for example `AdviceCalculator`), so they can be unit tested directly.
- Validate DTOs with DataAnnotations. `[ApiController]` then returns 400 ProblemDetails.
- Outside calls (ZTM, worker, Open-Meteo) use a typed `HttpClient` from `AddHttpClient`, with a timeout. ZTM failing gives a 503 ProblemDetails. The worker failing makes the API fall back to ZTM's own delay and mark `source: "fallback"`. Never return a stack trace.
- Use `async`/`await` and pass `CancellationToken`. Keep URLs, CORS origins and timeouts in configuration.
- Times are UTC in the backend. ZTM timestamps are UTC (`Z` suffix).
- Prefer clear, readable code over clever code.

## API rules

- Plural nouns under `/api`, no verbs in paths.
- Status codes: 200, 201 with `Location`, 204, 400, 404, 503. Errors are ProblemDetails.
- CORS allow-list from configuration (`Cors:AllowedOrigins`): `http://localhost:5173` in development, the GitHub Pages origin in production. Pages is HTTPS, so the deployed API must be HTTPS too.
- Swagger UI is enabled in development.

## Worker rules (Python)

- Python 3.14, type hints, `pytest`, `ruff`. One job per file.
- `train.py` uses a fixed random seed and writes `models/model.joblib` and `models/model_card.json` (data window, row counts, model and baseline metrics, library versions).
- While serving, the worker makes no outside calls; the API sends the weather.

## ML rules

- Train only on real collected data (CC BY, attributed in the README). Synthetic data is allowed only in tests, clearly labelled.
- Always compare with the baseline "final delay equals current delay". If the model does not beat it, say so.
- Split by time, never randomly.
- State limitations plainly, including the length of the data window.
- Never invent numbers in docs, commits or the UI. If something was not run, say so.

## Frontend rules (TypeScript / React)

- Strict TypeScript, no `any`. Function components.
- TanStack Query for server data. All `fetch` calls live in `src/api/`.
- Every screen has loading, empty and error states. Labelled inputs, usable by keyboard, works at 360 px width, respects `prefers-color-scheme`.

## Definition of done

1. It builds and `/verify` passes.
2. New behaviour has a test.
3. No dead code, commented-out code or unrelated edits.
4. Docs are updated if behaviour changed.
5. The commit message is a Conventional Commit.

## Git

- One branch per milestone (`feat/…`, `fix/…`, `docs/…`), small commits, no force-push.
- Conventional Commits, for example `feat(api): add commutes CRUD`. Every commit builds, so the history reads as the development story.
- Commits that Claude authors end with a `Co-Authored-By` trailer.

## Scope

Out of scope: authentication, an external message broker, other cities, push notifications. No secrets in the repository: `.env` is ignored, `.env.example` is committed.

When unsure about a library API (EF Core, TanStack Query, FastAPI), check the current documentation instead of relying on memory.
