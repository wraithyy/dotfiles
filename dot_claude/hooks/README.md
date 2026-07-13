# Claude Code Hooks

Registered in `dot_claude/settings.json.tmpl` (chezmoi source of truth).
See `~/.claude/rules/hooks.md` for the event -> hook table.

| Script | Purpose |
|---|---|
| smart-notify.sh | unified notifications (permission/question/done), platform dispatch: osascript / wsl-notify-send / notify-send, tmux display-message branch |
| block-sensitive-files.sh | PreToolUse deny-list for secret files and credential dirs |
| fe-post-edit.sh | biome/prettier format after Edit/Write |
| stop-verify.sh | once-per-session tsc + console.log audit on Stop |
| precompact-todos.sh | preserves todos across compaction |
| companion-forward.sh | forwards events to the companion plugin |

Test a hook manually by piping a payload:

```sh
echo '{"hook_event_name":"Stop","cwd":"'$PWD'"}' | ~/.claude/hooks/smart-notify.sh
```
