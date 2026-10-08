#!/usr/bin/env bash
# SessionStart: run claude-config-lint --quick once per day, surface findings into context.
set -uo pipefail
command -v claude-config-lint >/dev/null || exit 0
cache="${XDG_CACHE_HOME:-$HOME/.cache}/claude-config-lint"; mkdir -p "$cache"
stamp="$cache/$(date +%F)"
[ -f "$stamp" ] && exit 0
out=$(claude-config-lint --quick 2>&1 | grep -E '^(ERROR|WARN)' | head -12)
touch "$stamp"; find "$cache" -type f -mtime +7 -delete 2>/dev/null
[ -z "$out" ] && exit 0
jq -cn --arg c "claude-config-lint (daily, --quick):
$out
Full run: claude-config-lint" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}'
