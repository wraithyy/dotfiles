# tmux/herdr + Claude Code workflow

Sessions run in a multiplexer: nvim in one pane, Claude Code in another,
dev server / tests in sibling panes. Detect which: `$HERDR_ENV` = herdr,
`$TMUX` = tmux (migration to herdr in progress, both may appear).

- Read sibling panes instead of asking the user to paste (dev server output,
  test runs, stacktraces).
  - herdr: `herdr pane list` (JSON, includes agent state), read with
    `herdr pane read <pane_id> --source recent-unwrapped`
  - tmux: `tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_current_command}'`,
    read with `tmux capture-pane -p -t <target>`
- Leave changes uncommitted after a task; the user reviews in Diffview /
  gitsigns / lazygit and commits when ready. Commit only when asked.
- nvim autoreads edited files (autoread + checktime), so don't tell the user
  to reload after you edit.
