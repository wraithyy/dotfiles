#!/usr/bin/env bash
# PreToolUse Edit|Write|MultiEdit: deny edits to live files chezmoi manages.
# Edit the source in ~/.local/share/chezmoi and `chezmoi apply` instead.
# Escape hatch for a whole session: CLAUDE_LIVE_EDIT=1 claude
set -uo pipefail
[ "${CLAUDE_LIVE_EDIT:-}" = 1 ] && exit 0
command -v chezmoi >/dev/null || exit 0
command -v jq >/dev/null || exit 0

input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -z "$path" ] && exit 0
case "$path" in /*) ;; *) path="$(printf '%s' "$input" | jq -r '.cwd')/$path" ;; esac

# collapse . and .. without touching the filesystem (file may not exist yet)
norm() {
  local out=() p; IFS=/ read -ra parts <<< "$1"
  for p in "${parts[@]}"; do
    case "$p" in ""|.) ;; ..) [ ${#out[@]} -gt 0 ] && unset "out[$((${#out[@]}-1))]" ;; *) out+=("$p") ;; esac
  done
  printf '/%s' "${out[@]}" | sed 's|^//|/|'
}
path=$(norm "$path")

# never guard: memory/transcripts, local overrides, plugin caches, chezmoi source itself
case "$path" in
  "$HOME"/.claude/projects/*|"$HOME"/.claude/settings.local.json|"$HOME"/.claude/plugins/*|"$HOME"/.local/share/chezmoi/*) exit 0 ;;
esac

# ~100 ms; no cache so `chezmoi add` takes effect immediately
chezmoi managed --path-style=absolute --include=files 2>/dev/null | grep -qxF "$path" || exit 0

src=$(chezmoi source-path "$path" 2>/dev/null || echo "?")
jq -cn --arg r "live-edit-guard: $path is managed by chezmoi. Edit the source $src and run 'chezmoi apply' (or start the session with CLAUDE_LIVE_EDIT=1 to bypass)." \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
