# DelayOracle

DelayOracle tells you when to leave home to catch public transport in Gdańsk. It combines live ZTM Gdańsk departures, a delay prediction from a trained model, and your walking time to the stop.

**Status:** the API stores commutes, searches ZTM stops, returns live departures with a delay predicted by the trained model, and answers when to leave for a commute. The real UI comes in a later milestone (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

## Parts

| Folder | What it is |
|---|---|
| `backend/` | ASP.NET Core API (.NET 10) with xUnit tests |
| `ai-worker/` | Python 3.14 FastAPI worker that serves delay predictions from a PyTorch model, plus the data collector and the training script |
| `frontend/` | React + TypeScript app built with Vite |

## Run locally

Requirements: .NET 10 SDK, Python 3.14, Node.js 24. Commands are for PowerShell, from the repository root.

**Backend** (http://localhost:5000, Swagger UI at `/swagger`)

```powershell
dotnet run --project backend/DelayOracle.Api --urls http://localhost:5000
```

The API creates its SQLite database (`backend/DelayOracle.Api/app.db`) on first start. Example (stops and departures need network access to ZTM Gdańsk):

```powershell
# Find a stop, then see its live departures
Invoke-RestMethod "http://localhost:5000/api/stops?query=brama wyz"
Invoke-RestMethod http://localhost:5000/api/stops/1028/departures

# Save a commute, then ask when to leave
$commute = Invoke-RestMethod http://localhost:5000/api/commutes -Method Post -ContentType "application/json" `
  -Body '{"name":"Home to work","stopId":1028,"walkMinutes":5}'
Invoke-RestMethod "http://localhost:5000/api/commutes/$($commute.id)/advice"
```

A commute's id is a random GUID and is the only key to it. There is no login: whoever has the id can read, change and delete the commute, and the API does not list commutes without their ids.

`routeShortName` is optional in a commute; when set, the advice only considers that line.

Each departure has a `source`: `model` when the worker predicted the delay, `fallback` when the worker is not running (ZTM's own delay is used), and `schedule` when ZTM has no live data for it. Start the worker (below) to get `model`. The model's measured error is at:

```powershell
Invoke-RestMethod http://localhost:5000/api/model
```

After changing an entity, generate a migration (run `dotnet tool restore` once first):

```powershell
dotnet ef migrations add <Name> --project backend/DelayOracle.Api --output-dir Data/Migrations
```

**Worker** (http://localhost:8000)

```powershell
cd ai-worker
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --port 8000
```

**Frontend** (http://localhost:5173)

```powershell
cd frontend
npm ci
npm run dev
```

To point the frontend at a different API, copy `frontend/.env.example` to `frontend/.env.local` and change `VITE_API_URL`.

**Everything with Docker**

```powershell
docker compose up --build
```

Check that the parts answer:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:8000/health
```

## Checks

| Part | Commands |
|---|---|
| Backend | `dotnet build backend/DelayOracle.slnx -warnaserror`, `dotnet test backend/DelayOracle.slnx` |
| Worker (in `ai-worker/`, venv active) | `ruff check .`, `pytest` |
| Frontend (in `frontend/`) | `npm run lint`, `npm test -- --run`, `npm run build` |

The same checks run in GitHub Actions on every pull request (`.github/workflows/ci.yml`).

## Prediction model

The model predicts how much a vehicle's delay will change between now and its departure. It is a small PyTorch network trained by `ai-worker/train.py` on real departures collected from ZTM Gdańsk. It uses three inputs: the current delay, the minutes left to the departure, and the local hour. The numbers below are from `ai-worker/models/model_card.json`, which `train.py` writes.

| | |
|---|---|
| Data | 28,110 departures at 250 stops, Friday 13 November 2026 09:30 to Saturday 14 November 2026 14:25 (local time) |
| Split by time | first 80% trains (22,488 rows), last 20% tests (5,622 rows, Saturday 08:42 to 14:25) |
| Baseline | "the final delay equals the current delay", which is what ZTM shows |
| Mean absolute error on the test rows | model 113.0 s, baseline 159.2 s |
| The same for departures under 10 minutes away (122 test rows) | model 77.3 s, baseline 90.7 s |

To reproduce: `cd ai-worker`, then `python train.py` (about 10 seconds, no network needed).

A full walkthrough of the data, the model, the training, the worker and the API integration, with a glossary, is in [docs/PREDICTION_MODEL.pdf](docs/PREDICTION_MODEL.pdf).

### Limitations

- **Two days of data.** The model has seen one Friday and part of one Saturday. It knows nothing about other weekdays, rush hours on a normal working week, holidays or other seasons, and it was tested on a single Saturday morning. The result above describes those hours, not the system in general.
- **No weekday and no weather.** Both were planned as inputs, together with a weather client in the API (Open-Meteo). They were left out of the current implementation for lack of time: two days cover two weekdays and temperatures of 4.3 to 7.9 °C with 0.6 mm of rain. A model trained with them scored worse (119.0 s) and gave wrong predictions for other weekdays and temperatures, for example a delay of over 20 minutes at 20 °C.
- **The inputs were chosen with the test rows.** The three-input model was picked after comparing versions on the same test rows, so its 113.0 s is somewhat optimistic.
- **Few close departures.** The collector stored only the first and the last sighting of each departure, and the first sighting is usually about 28 minutes ahead. The result for departures under 10 minutes away rests on 122 test rows and should be read as "no worse than ZTM", not as a proven gain.
- **One model type.** The network was not compared with other kinds of model, only with the baseline.

### Planned improvements

- Collect again over several weeks. The collector now stores every sighting of a departure (`sightings` table), so the delay can be followed down to the last minutes.
- Retrain on the longer dataset with examples at every distance from the departure, and check the close departures again.
- Introduce the weekday and the weather as inputs, and the weather client in the API, once the collection covers full weeks and a range of weather.

## Attribution

- Real-time data: ZTM Gdańsk open data portal (CC BY).
