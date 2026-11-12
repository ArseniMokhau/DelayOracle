---
description: Close a milestone: verify, update docs and the AI usage log, draft the pull request
argument-hint: <milestone number>
---
Close milestone: $ARGUMENTS

1. Run `/verify`. Stop if anything fails.
2. Check the milestone's "Done when" criterion in the Milestones section of `docs/ARCHITECTURE.md`. Say what is met and what is missing.
3. Update the README sections the milestone affects. Follow the run steps literally, as if from a clean clone, and report any step that would fail.
4. Draft an entry for `docs/AI_USAGE.md`: what Claude did and what had to be corrected. The log covers AI work only.
5. Draft the pull request description: what and why, how it was verified (paste the `/verify` table), a screenshot or GIF for UI changes.
6. Suggest the next milestone.
