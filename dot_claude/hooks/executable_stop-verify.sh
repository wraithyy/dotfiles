#!/bin/bash
# Stop hook: once-per-session FE verification (typecheck + console.log audit).
# Exit 2 nudges Claude to fix findings; a session marker prevents infinite
# stop/verify loops (one nudge per session, then informational only).

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id // "unknown"')
cwd=$(echo "$input" | jq -r '.cwd // ""')

[[ -z "$cwd" || ! -d "$cwd" ]] && exit 0
[[ -f "$cwd/package.json" ]] || exit 0

# Modified TS/JS files in the working tree (skip if not a git repo / no changes)
modified=$(cd "$cwd" && git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$')
[[ -z "$modified" ]] && exit 0

findings=""

# console.log audit on modified files only
logs=$(cd "$cwd" && grep -n 'console\.log' $modified 2>/dev/null | head -10)
[[ -n "$logs" ]] && findings+="console.log left in modified files:
$logs
"

# typecheck once per session end (not per edit)
if [[ -f "$cwd/tsconfig.json" ]]; then
  tsc_output=$(cd "$cwd" && timeout 60 npx tsc --noEmit 2>&1)
  if [[ $? -ne 0 && -n "$tsc_output" ]]; then
    findings+="TypeScript errors:
$(echo "$tsc_output" | head -20)
"
  fi
fi

[[ -z "$findings" ]] && exit 0

marker="/tmp/claude-stop-verify-$session_id"
if [[ ! -f "$marker" ]]; then
  touch "$marker"
  echo "$findings" >&2
  exit 2
fi

echo "$findings"
exit 0
