---
description: Summarize repo changes since my last commit (great after Claude's solo work)
---

Summarize what happened in this repository since the user's last own commit.

1. Get the user's git identity: `git config user.email`.
2. Find their most recent commit: `git log --author="<email>" -1 --format=%H`.
   If none exists, use the last 10 commits as the window instead.
3. Collect what happened after it:
   - `git log <hash>..HEAD --oneline --no-merges`
   - `git diff <hash>..HEAD --stat`
   - `git status --short` for uncommitted work
4. Report in this order, terse:
   - one-paragraph gist of the overall direction
   - commits grouped by area/feature, not chronologically
   - files with the largest churn and why
   - anything risky: breaking changes, deleted files, config/schema edits,
     new dependencies, TODO/FIXME added
   - uncommitted changes summary, if any
5. If nothing happened since that commit, say so and summarize uncommitted
   changes only.

Do not paste raw diffs; reference `file:line` so I can jump there.
