# DelayOracle

DelayOracle tells you when to leave home to catch public transport in Gdańsk. It combines live ZTM Gdańsk departures, a delay prediction from a trained model, and your walking time to the stop.

**Status:** the API stores commutes, searches ZTM stops, returns live departures for a stop and answers when to leave for a commute. The predicted delay is currently ZTM's own live delay (`source: "fallback"`); the trained model and the real UI come in later milestones (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

## Parts

| Folder | What it is |
|---|---|
| `backend/` | ASP.NET Core API (.NET 10) with xUnit tests |
| `ai-worker/` | Python 3.14 FastAPI worker that will serve delay predictions |
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

# Save a commute, then ask when to leave (use the id from the first answer)
Invoke-RestMethod http://localhost:5000/api/commutes -Method Post -ContentType "application/json" `
  -Body '{"name":"Home to work","stopId":1028,"walkMinutes":5}'
Invoke-RestMethod http://localhost:5000/api/commutes/1/advice
```

`routeShortName` is optional in a commute; when set, the advice only considers that line.

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

The model predicts how much a vehicle's delay will change between now and its departure. It is a small PyTorch network trained by `ai-worker/train.py` on real departures collected from ZTM Gdańsk. The numbers below are from `ai-worker/models/model_card.json`, which `train.py` writes.

| | |
|---|---|
| Data | 28,110 departures at 250 stops, Friday 13 November 2026 09:30 to Saturday 14 November 2026 14:25 (local time) |
| Split by time | first 80% trains (22,488 rows), last 20% tests (5,622 rows, Saturday 08:42 to 14:25) |
| Baseline | "the final delay equals the current delay", which is what ZTM shows |
| Mean absolute error on the test rows | model 119.0 s, baseline 159.2 s |

To reproduce: `cd ai-worker`, then `python train.py` (about 10 seconds, no network needed).

### Limitations

- **Two days of data.** The model has seen one Friday and part of one Saturday. It knows nothing about other weekdays, rush hours on a normal working week, holidays or other seasons, and it was tested on a single Saturday morning. The result above describes those hours, not the system in general.
- **Close departures are not predicted better than ZTM.** For departures less than 10 minutes away (122 test rows) the model's error is 97.4 s and the baseline's is 90.7 s. The cause is the short collection: the collector stored only the first and the last sighting of each departure, and the first sighting is usually about 28 minutes ahead, so the model saw few close departures.
- **Weather barely varied.** Temperatures stayed between 4.3 and 7.9 °C with 0.6 mm of rain in total, and one weather reading is used for the whole city, so the weather features have had little to learn from.
- **One model type.** The network was not compared with other kinds of model, only with the baseline.

### Planned improvements

- Collect again over several weeks. The collector now stores every sighting of a departure (`sightings` table), so the delay can be followed down to the last minutes.
- Retrain on the longer dataset with examples at every distance from the departure, and check the close departures again.

## Attribution

- Real-time data: ZTM Gdańsk open data portal (CC BY).
- Weather: Open-Meteo.
