---
description: Create clean Conventional Commits from the working tree
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*)
---
1. Run `git status` and `git diff` (staged and unstaged). Never stage secrets, `.env`, `delays.db*`, `app.db*` or build output.
2. Group the changes into logical commits. If the tree mixes concerns, stage specific files per commit.
3. For each commit write `type(scope): subject`.
   - Types: feat, fix, refactor, test, docs, chore, ci, build.
   - Scopes: api, worker, web, ci, docs.
   - Subject: imperative, lower case, at most 72 characters, no full stop.
   - Body (optional): why the change was made, not what changed.
4. End the message with the `Co-Authored-By` trailer for Claude when Claude wrote the change.
5. Show me the list of commits you intend to make and wait for confirmation before committing.
6. Never amend, never force-push, never skip hooks, and never commit directly to `main` when a feature branch exists.
