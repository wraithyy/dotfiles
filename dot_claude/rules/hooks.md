# Hooks (source of truth: settings.json.tmpl)

| Event | Hook | Does |
|---|---|---|
| PermissionRequest * | smart-notify.sh | notify "needs permission" (Sosumi / yellow tmux) |
| PreToolUse Read+Bash | block-sensitive-files.sh | deny secrets: .env*, keys, .pem, .aws/ .ssh/ ... exit 2 |
| PreToolUse AskUserQuestion | smart-notify.sh | notify question text (Glass / blue tmux) |
| PostToolUse Edit/Write/MultiEdit | fe-post-edit.sh | biome/prettier format edited file |
| Stop * | smart-notify.sh; stop-verify.sh | done notify (quiet 23-07); tsc + console.log audit, one nudge per session |
| all events | pixtuoid-hook (command -v guarded) | pixel-art session visualizer |

smart-notify dispatches per platform: osascript / wsl-notify-send / notify-send.
Edit hooks only in chezmoi source (settings.json.tmpl + hooks/), never live files.
