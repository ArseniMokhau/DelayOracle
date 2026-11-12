# DelayOracle

DelayOracle tells you when to leave home to catch public transport in Gdańsk. It combines live ZTM Gdańsk departures, a delay prediction from a trained model, and your walking time to the stop.

**Status:** project skeleton. Each part starts and answers a health check; the features come in later milestones (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

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

## Attribution

- Real-time data: ZTM Gdańsk open data portal (CC BY).
- Weather: Open-Meteo.
