# Claude Code hooks (chezmoi-managed, personal)

Registered in `settings.json.tmpl`. Portable guards (commit, edit, subagent evidence)
live in the cc-guard plugin instead: https://github.com/wraithyy/cc-guard

| Script | Purpose |
|---|---|
| op-preflight.sh | SessionStart: warn when 1Password SSH signing is broken |
| smart-notify.sh | notifications for permission prompts, questions, stop |
| block-sensitive-files.sh | deny Read/Bash on .env, keys, .ssh, .aws |
| ask-git-remote.sh | git/gh/glab/gitlab write commands -> ask; CLAUDE_GIT_YOLO=1 allows |
| block-doc-spam.sh | deny Write of unsolicited docs |
| live-edit-guard.sh | deny Edit/Write of live chezmoi-managed files; CLAUDE_LIVE_EDIT=1 bypasses |
| herdr-agent-state.sh | SessionStart: report agent state to herdr |
| context-mode-cache-heal.mjs | SessionStart: repair context-mode plugin cache |
| stop-verify.sh | Stop: tsc + console.log audit, one nudge per session |
| verify-claims.sh | Stop: "tests passed" claim without a test run -> block once |
