# tmux + Claude Code workflow

Sessions run in tmux: nvim in one pane, Claude Code in another, dev server /
tests in sibling panes.

- Read sibling panes instead of asking the user to paste. Find them with
  `tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_current_command}'`,
  read with `tmux capture-pane -p -t <target>` (dev server output, test runs,
  stacktraces).
- Leave changes uncommitted after a task; the user reviews in Diffview /
  gitsigns / lazygit and commits when ready. Commit only when asked.
- nvim autoreads edited files (autoread + checktime), so don't tell the user
  to reload after you edit.
