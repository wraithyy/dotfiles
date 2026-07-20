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

# GNU timeout is absent on stock macOS; fall back to gtimeout (coreutils) or no limit
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT="timeout 60"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT="gtimeout 60"
else
  TIMEOUT=""
fi

# typecheck once per session end (not per edit)
if [[ -f "$cwd/tsconfig.json" ]]; then
  tsc_output=$(cd "$cwd" && $TIMEOUT npx tsc --noEmit 2>&1)
  if [[ $? -ne 0 && -n "$tsc_output" ]]; then
    findings+="TypeScript errors:
$(echo "$tsc_output" | head -20)
"
  fi
fi

# lint modified files with whatever the project uses
if [[ -f "$cwd/biome.json" || -f "$cwd/biome.jsonc" ]]; then
  lint_output=$(cd "$cwd" && $TIMEOUT npx biome check $modified 2>&1)
  [[ $? -ne 0 && -n "$lint_output" ]] && findings+="Biome findings:
$(echo "$lint_output" | head -15)
"
elif ls "$cwd"/eslint.config.* "$cwd"/.eslintrc* >/dev/null 2>&1; then
  lint_output=$(cd "$cwd" && $TIMEOUT npx eslint $modified 2>&1)
  [[ $? -ne 0 && -n "$lint_output" ]] && findings+="ESLint findings:
$(echo "$lint_output" | head -15)
"
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
