---
description: Review the current changes against the project's quality bar (read-only)
---
Review the uncommitted changes and the branch changes (`git diff` and `git diff main...HEAD`). Do not edit any file.

Check against AGENTS.md:

- Structure: is logic in the right folder (controllers only handle HTTP; rules are plain methods)? Does the frontend call only the API, only from `src/api/`?
- API: REST naming, status codes, ProblemDetails, CORS from configuration.
- Quality: clear names, short functions, no dead or commented-out code, errors handled, UTC handled.
- Tests: is the new behaviour covered? Would the tests fail if the code broke?
- UX (if the UI changed): loading, empty and error states, keyboard use, narrow screens.
- ML (if touched): baseline comparison, time-based split, no invented numbers, limits stated.
- Security: secrets, input validation.

Report findings as Blocking, Should fix, or Nit, each with `file:line` and a concrete suggestion. End with one sentence on whether you would merge. If everything is fine, say so instead of inventing issues.
