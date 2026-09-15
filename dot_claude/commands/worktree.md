---
description: Create a git worktree + herdr workspace (or tmux window) with a parallel Claude session
argument-hint: <task-name>
---

Create an isolated worktree for task "$ARGUMENTS" and open a parallel Claude
session in it.

1. Guards: refuse outside a git repo. Sanitize the task name to
   kebab-case (`[a-z0-9-]`). If `$ARGUMENTS` is empty, ask for a task name.

2. Inside herdr (`$HERDR_ENV` = 1) — let herdr own the worktree:
   - `herdr worktree create --cwd <repo-root> --branch task/<task> --no-focus`
     (creates the worktree at `~/.herdr/worktrees/<repo>/task-<task>`, reuses
     the branch if it exists, and opens a dedicated workspace; JSON response
     has `root_pane.pane_id` and `workspace.workspace_id`)
   - launch Claude as a tracked agent:
     `herdr agent start <task> --kind claude --pane <root_pane.pane_id>`
   - cleanup hint: `herdr worktree remove --workspace <workspace_id>`
     (removes worktree + workspace; branch survives — delete with
     `git branch -d task/<task>` when merged)

3. Inside tmux (no herdr) — manage the worktree yourself:
   - worktree dir: `../<repo>.worktrees/<task>`, branch `task/<task>`
     (reuse branch if it exists, else `-b` from current HEAD):
     `git worktree add ../<repo>.worktrees/<task> -b task/<task>`
   - `tmux new-window -n <task> -c <worktree-dir> claude`
   - cleanup hint:
     `git worktree remove ../<repo>.worktrees/<task> && git branch -d task/<task>`

4. Outside both: create the worktree as in step 3 and print the command to run:
   `tmux new-session -s <task> -c <worktree-dir> claude`

Keep output to the created path, branch name, how to attach, and the cleanup hint.
