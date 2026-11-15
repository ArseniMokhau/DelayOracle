# DelayOracle

**Language:** [Polski](README.md) · English

DelayOracle tells you when to leave home to catch public transport in Gdańsk. It combines live ZTM Gdańsk departures, a delay prediction from a trained model, and your walking time to the stop.

**Status:** the application is complete and runs locally. It is not hosted anywhere: deployment is postponed, because the project has no hosting resources for now.

## 1. The application and what it does

The app has two tabs.

- **Departures:** search for a stop and see its live departures. Each one shows the scheduled time, the predicted time, the delay in words, and where the prediction came from (the model, ZTM's own live delay, or only the timetable). A card shows the model's measured error next to the baseline.
- **My commutes:** save a trip (stop, optional line, walking time) and see when to leave for it, for example "Leave in 6 minutes". The answer refreshes every 30 seconds. Commutes can be edited and deleted.

Other things worth knowing:

- **A personal list without a login.** The browser remembers the commutes created in it. "Copy link" produces a link that adds the same commutes on another device. The two devices then share those commutes, so an edit or a delete on one shows on the other.
- **Every screen has loading, empty and error states.** The layout works from 360 px width, and follows the system's light or dark colour scheme. Controls are real buttons and labelled fields with a visible focus outline.
- **It keeps working without the model.** When the prediction worker is not running, the app shows ZTM's own delay and says so.

## 2. Technical description

### Technologies

| Part | Folder | Technology |
|---|---|---|
| API | `backend/` | C#, ASP.NET Core (.NET 10), EF Core, SQLite, xUnit |
| Prediction worker | `ai-worker/` | Python 3.14, FastAPI, PyTorch, pytest, ruff |
| Web app | `frontend/` | React, TypeScript, Vite, TanStack Query, Vitest |
| Tooling | | Docker Compose, GitHub Actions (build, tests and lint on every pull request) |
| Data | | ZTM Gdańsk open data (CC BY) |

The frontend talks only to the API. The API calls ZTM for stops and departures, and the worker for predictions. The full design is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Solutions worth a look

- **A trained model with an honest baseline.** A small PyTorch network predicts how much a vehicle's delay will change before it departs. It is always compared with the baseline "the final delay equals the current delay", which is what ZTM shows. The split is by time, never random, and the limitations are written down (see [Prediction model](#5-prediction-model)).
- **Fallback instead of failure.** If the worker does not answer within its timeout, the API returns ZTM's own delay and marks the departure `source: "fallback"`. If ZTM itself is down, the API answers 503 with a ProblemDetails body, and the app shows an error tile with a retry button.
- **Commutes without accounts.** A commute's id is a random GUID and is the only key to it. The API never lists commutes that were not asked for by id. The browser keeps its ids in `localStorage`, and a share link carries them in the URL hash, which browsers do not send to the server. This is not authentication: whoever is given an id can read, change and delete that commute.
- **The advice rule is a pure function.** `AdviceCalculator` takes the departures, the walking time and the current time, and has no I/O, so it is unit tested directly. The clock is injected (`TimeProvider`), which lets the endpoint tests run at a fixed time.
- **One place builds the model's inputs.** The worker's `features.py` is used by both training and serving, so the two cannot drift apart.
- **Tests at every layer.** The API is tested through HTTP with in-memory SQLite and fake ZTM and worker servers. Every frontend component and page is tested against a fake `fetch`, including its loading, empty and error states.

## 3. Run it locally, step by step

Commands are for PowerShell, from the repository root. Use a separate terminal for each of steps 2 to 4 and leave them running.

### What you need

- .NET 10 SDK
- Node.js 24
- Python 3.14 (only for the prediction worker)
- Network access to ZTM Gdańsk's open data

### Step 1: get the code

```powershell
git clone https://github.com/ArseniMokhau/DelayOracle.git
cd DelayOracle
```

### Step 2: start the API

```powershell
dotnet run --project backend/DelayOracle.Api --urls http://localhost:5000
```

The API creates its SQLite database on first start. It is ready when this answers:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Swagger UI is at http://localhost:5000/swagger.

### Step 3: start the prediction worker (optional)

Without the worker the app still works and shows ZTM's own delay. With it, departures are marked "Model".

```powershell
cd ai-worker
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --port 8000
```

### Step 4: start the frontend

```powershell
cd frontend
npm ci
npm run dev
```

### Step 5: open the app

Go to http://localhost:5173. On **Departures**, type a stop name such as "brama" and pick a stop. On **My commutes**, add your first commute.

To point the frontend at a different API address, copy `frontend/.env.example` to `frontend/.env.local` and change `VITE_API_URL`.

### Alternative: everything with Docker

With Docker Desktop running, one command starts all three parts on the same addresses:

```powershell
docker compose up --build
```

### Checks

| Part | Commands |
|---|---|
| API | `dotnet build backend/DelayOracle.slnx -warnaserror`, `dotnet test backend/DelayOracle.slnx` |
| Worker (in `ai-worker/`, venv active) | `ruff check .`, `pytest` |
| Frontend (in `frontend/`) | `npm run lint`, `npm test -- --run`, `npm run build` |

The same checks run in GitHub Actions on every pull request (`.github/workflows/ci.yml`).

### Trying the API by hand

```powershell
# Find a stop, then see its live departures
Invoke-RestMethod "http://localhost:5000/api/stops?query=brama wyz"
Invoke-RestMethod http://localhost:5000/api/stops/1028/departures

# Save a commute, then ask when to leave
$commute = Invoke-RestMethod http://localhost:5000/api/commutes -Method Post -ContentType "application/json" `
  -Body '{"name":"Home to work","stopId":1028,"walkMinutes":5}'
Invoke-RestMethod "http://localhost:5000/api/commutes/$($commute.id)/advice"

# The model's measured error
Invoke-RestMethod http://localhost:5000/api/model
```

After changing an entity, generate a migration (run `dotnet tool restore` once first):

```powershell
dotnet ef migrations add <Name> --project backend/DelayOracle.Api --output-dir Data/Migrations
```

## 4. How AI tools were used

I wrote the application code myself. AI tools supported the work around it:

- **Claude (chat)** helped at the start: researching whether free, real data existed for the idea, and writing throwaway spikes to check the data source and the stack.
- **Claude Code** worked inside the repository, steered by project rules in `AGENTS.md` and `CLAUDE.md` and by slash commands in `.claude/commands/` (`/verify`, `/commit`, `/review`, `/milestone-done`). I used it to:
  - scaffold the skeleton: the three projects, Dockerfiles, Docker Compose and the CI workflow;
  - write the tests for each step;
  - produce the HTML design mocks and the CSS of the chosen look;
  - draft documentation and split work into commits.

Some things had to be corrected, for example:

- Its first model used six inputs, including weekday and weather. Probing showed wrong predictions outside the two collected days, so the model was reduced to three inputs.
- Its tests once missed that a timestamp lost its UTC marker when read back from SQLite. A test on the raw JSON was added and the bug fixed.
- Its first frontend design kept commutes shared by all visitors. It was replaced by the personal list with a share link.

The full record, milestone by milestone, is in [docs/AI_USAGE.md](docs/AI_USAGE.md).

## 5. Prediction model

The model predicts how much a vehicle's delay will change between now and its departure. It is a small PyTorch network trained by `ai-worker/train.py` on real departures collected from ZTM Gdańsk. It uses three inputs: the current delay, the minutes left to the departure, and the local hour. The numbers below are from `ai-worker/models/model_card.json`, which `train.py` writes.

| | |
|---|---|
| Data | 28,110 departures at 250 stops, Friday 13 November 2026 09:30 to Saturday 14 November 2026 14:25 (local time) |
| Split by time | first 80% trains (22,488 rows), last 20% tests (5,622 rows, Saturday 08:42 to 14:25) |
| Baseline | "the final delay equals the current delay", which is what ZTM shows |
| Mean absolute error on the test rows | model 113.0 s, baseline 159.2 s |
| The same for departures under 10 minutes away (122 test rows) | model 77.3 s, baseline 90.7 s |

To reproduce: `cd ai-worker`, then `python train.py` (about 10 seconds, no network needed).

A full walkthrough of the data, the model, the training, the worker and the API integration, with a glossary, is in [docs/PREDICTION_MODEL.pdf](docs/PREDICTION_MODEL.pdf) (in English).

### Limitations

- **Two days of data.** The model has seen one Friday and part of one Saturday. It knows nothing about other weekdays, rush hours on a normal working week, holidays or other seasons, and it was tested on a single Saturday morning. The result above describes those hours, not the system in general.
- **No weekday and no weather.** Both were planned as inputs, together with a weather client in the API (Open-Meteo). They were left out of the current implementation for lack of time: two days cover two weekdays and temperatures of 4.3 to 7.9 °C with 0.6 mm of rain. A model trained with them scored worse (119.0 s) and gave wrong predictions for other weekdays and temperatures, for example a delay of over 20 minutes at 20 °C.
- **The inputs were chosen with the test rows.** The three-input model was picked after comparing versions on the same test rows, so its 113.0 s is somewhat optimistic.
- **Few close departures.** The collector stored only the first and the last sighting of each departure, and the first sighting is usually about 28 minutes ahead. The result for departures under 10 minutes away rests on 122 test rows and should be read as "no worse than ZTM", not as a proven gain.
- **One model type.** The network was not compared with other kinds of model, only with the baseline.

## 6. Postponed

- **Deployment.** Hosting the API and the worker needs resources the project does not have for now (the worker's Docker image alone is about 1.6 GB). The app is ready for it: the API address and the allowed CORS origins are configuration, and every part has a Dockerfile.
- **A longer data collection and retraining.** The collector now stores every sighting of a departure (`sightings` table), so the delay can be followed down to the last minutes. Retraining on several weeks of data would let the close departures be checked again.
- **Weekday and weather as inputs,** with the weather client in the API, once the collection covers full weeks and a range of weather.

## Attribution

- Real-time data: ZTM Gdańsk open data portal (CC BY).
