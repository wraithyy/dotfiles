---
description: Create a git worktree + tmux/herdr window with a parallel Claude session
argument-hint: <task-name>
---

Create an isolated worktree for task "$ARGUMENTS" and open a parallel Claude
session in it.

1. Guards: refuse outside a git repo. Sanitize the task name to
   kebab-case (`[a-z0-9-]`). If `$ARGUMENTS` is empty, ask for a task name.
2. Determine paths:
   - repo root: `git rev-parse --show-toplevel`, its basename = `<repo>`
   - worktree dir: `../<repo>.worktrees/<task>` (create parent if missing)
   - branch: `task/<task>`; reuse if it exists, else branch from current HEAD
3. Create: `git worktree add ../<repo>.worktrees/<task> -b task/<task>`
   (drop `-b` when the branch already exists).
4. Open the session:
   - inside herdr (`$HERDR_ENV` set): create a tab and launch Claude in it:
     `herdr tab create --label <task> --cwd <worktree-dir>` then
     `herdr pane run <root_pane_id from the JSON response> claude`
   - inside tmux: `tmux new-window -n <task> -c <worktree-dir> claude`
   - outside both: print the command to run:
     `tmux new-session -s <task> -c <worktree-dir> claude`
5. Print cleanup hint for later:
   `git worktree remove ../<repo>.worktrees/<task> && git branch -d task/<task>`

Keep output to the created path, branch name, and how to attach.
