---
description: Create a git worktree + herdr workspace (or tmux window) with a parallel Claude session
argument-hint: <task-name>
---

Run `wt $ARGUMENTS` (script in `~/.local/bin`, deterministic; handles herdr /
tmux / bare-shell cases itself). If `$ARGUMENTS` is empty, ask for a task name
first. Relay the script output verbatim; on non-zero exit, show stderr and stop.
