# Hooks (source of truth: settings.json.tmpl; portable ones live in the cc-guard plugin)

| Event | Hook | Does |
|---|---|---|
| SessionStart startup | op-preflight.sh | throwaway op-ssh-sign signature; warns into context when 1P signing broken |
| PermissionRequest * | smart-notify.sh | notify "needs permission" (Sosumi / yellow tmux) |
| PreToolUse Edit/Write/MultiEdit | live-edit-guard.sh | deny edits to live chezmoi-managed files, points at source path; bypass `CLAUDE_LIVE_EDIT=1 claude` |
| PreToolUse Bash `git commit` | cc-guard commit-guard.sh (plugin) | gitleaks on staged diff, conventional subject, no emoji → deny. Config via `git config cc-guard.*` (trask repos: commitFormat=false) |
| PreToolUse Read+Bash | block-sensitive-files.sh | deny secrets: .env*, keys, .pem, .aws/ .ssh/ ... exit 2 |
| PreToolUse Bash + mcp__gitlab__ writes | ask-git-remote.sh | git commit/push/merge/rebase/tag/stash, gh, glab, gitlab MR/push tools → `ask`; s `CLAUDE_GIT_YOLO=1 claude` → `allow` (per-session opt-in). Nahrazuje `permissions.ask` — ask pravidla promptují vždy, nelze je pro session povolit |
| PreToolUse AskUserQuestion | smart-notify.sh | notify question text (Glass / blue tmux) |
| PostToolUse Edit/Write/MultiEdit | cc-guard post-edit.sh (plugin) | biome/prettier format; block TS `any` w/o comment, bare @ts-ignore, emoji; warn console.log, TODO, eslint-disable w/o reason, Czech text, shellcheck |
| Stop * | smart-notify.sh; stop-verify.sh | done notify (quiet 23-07); tsc + console.log audit, one nudge per session |
| Stop * | verify-claims.sh | claim "testy prošly" bez test-runner tool_use v transcriptu → exit 2, one nudge per session |
| all events | pixtuoid-hook (command -v guarded) | pixel-art session visualizer |

Git-level twins of commit-guard (`~/.config/git/hooks/pre-commit`, `commit-msg`) come from
cc-guard via .chezmoiexternal and `core.hooksPath`; they chain to each repo's `.git/hooks`.

smart-notify dispatches per platform: osascript / wsl-notify-send / notify-send.
Edit hooks only in chezmoi source (settings.json.tmpl + hooks/), never live files.
