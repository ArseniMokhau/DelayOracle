@AGENTS.md

# Claude Code instructions

Code, comments, commits and documentation are in English.

## Working agreement

- Plan first for changes that touch more than three files, and wait for approval.
- Read a similar existing file before writing, and match its structure and naming.
- Make the smallest change that does the job. Mention unrelated problems instead of fixing them.
- Write the failing test first for business rules and bug fixes.
- Run `/verify`, or the relevant part, before saying a task is done, and report the real result. If you could not run something, say so. Never claim a check passed that you did not run.
- Ask when a requirement is ambiguous and a wrong guess would be expensive. Otherwise choose the conventional option and note it.
- No new dependency without a one-line reason. Do not hand-edit EF Core migrations.
- When you finish, summarise in a few sentences what changed and how the files connect.

## Slash commands (`.claude/commands/`)

| Command | Use it to |
|---|---|
| `/verify` | Run build, tests and lint for all three parts |
| `/commit` | Split the working tree into clean Conventional Commits |
| `/review` | Review the current changes against the quality bar (read-only) |
| `/explain <path>` | Explain what a file does and how it connects |
| `/milestone-done <n>` | Verify, update docs and the AI usage log, draft the PR |

## AI usage log

After each milestone add an entry to `docs/AI_USAGE.md`: what was done, what had to be corrected. Draft it from the real session. Do not invent it. The README's AI usage section is built from this log.

## Environment

- Windows with PowerShell. Paths may contain spaces, so quote them.
- The shell may have no network access. When a command needs it (package installs, ZTM, Open-Meteo), say so instead of faking output.
