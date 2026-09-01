# Hooks (source of truth: settings.json.tmpl)

| Event | Hook | Does |
|---|---|---|
| SessionStart startup | op-preflight.sh | throwaway op-ssh-sign signature; warns into context when 1P signing broken |
| PermissionRequest * | smart-notify.sh | notify "needs permission" (Sosumi / yellow tmux) |
| PreToolUse Read+Bash | block-sensitive-files.sh | deny secrets: .env*, keys, .pem, .aws/ .ssh/ ... exit 2 |
| PreToolUse Bash + mcp__gitlab__ writes | ask-git-remote.sh | git commit/push/merge/rebase/tag/stash, gh, glab, gitlab MR/push tools → `ask`; s `CLAUDE_GIT_YOLO=1 claude` → `allow` (per-session opt-in). Nahrazuje `permissions.ask` — ask pravidla promptují vždy, nelze je pro session povolit |
| PreToolUse AskUserQuestion | smart-notify.sh | notify question text (Glass / blue tmux) |
| PostToolUse Edit/Write/MultiEdit | fe-post-edit.sh | biome/prettier format edited file |
| Stop * | smart-notify.sh; stop-verify.sh | done notify (quiet 23-07); tsc + console.log audit, one nudge per session |
| Stop * | verify-claims.sh | claim "testy prošly" bez test-runner tool_use v transcriptu → exit 2, one nudge per session |
| Stop * | too-long.sh | odpověď >TOO_LONG_LIMIT slov (default 350) → block, přepiš stručně; off: TOO_LONG_LIMIT=0 |
| all events | pixtuoid-hook (command -v guarded) | pixel-art session visualizer |

smart-notify dispatches per platform: osascript / wsl-notify-send / notify-send.
Edit hooks only in chezmoi source (settings.json.tmpl + hooks/), never live files.
