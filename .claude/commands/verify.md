---
description: Run every check (build, tests, lint) across backend, worker and frontend and summarise honestly
allowed-tools: Bash(dotnet build:*), Bash(dotnet test:*), Bash(pytest:*), Bash(ruff:*), Bash(npm run:*), Bash(npm test:*), Bash(npm ci:*)
---
Run the full verification for this repository and report the results honestly.

1. Backend: `dotnet build backend/DelayOracle.slnx -warnaserror`, then `dotnet test backend/DelayOracle.slnx --no-build`.
2. Worker (from `ai-worker/`): `ruff check .`, then `pytest`.
3. Frontend (from `frontend/`): `npm run lint`, `npm test -- --run`, `npm run build`.

Skip a part only if it does not exist yet, and say that you skipped it.

Output a table: part, check, pass or fail. For each failure show the first relevant error and the likely cause. Do not fix anything unless I ask. Never report a check as passed if you did not run it.
