#!/usr/bin/env bash
# PreCompact: extract latest TodoWrite state from transcript and persist to disk.
# After compaction, todos can be referenced from ~/.claude/logs/todos/.
set -uo pipefail

command -v jq &>/dev/null || exit 0

payload=$(cat)
transcript=$(printf '%s' "$payload" | jq -r '.transcript_path // ""')
session_id=$(printf '%s' "$payload" | jq -r '.session_id // "unknown"')

[[ -z "$transcript" || ! -f "$transcript" ]] && exit 0

dir="$HOME/.claude/logs/todos"
mkdir -p "$dir"

ts=$(date +%Y%m%dT%H%M%S)
out="$dir/${session_id}-${ts}.json"
latest="$dir/${session_id}-latest.json"

# Find last TodoWrite tool_use in transcript JSONL, extract .input.todos
last_todos=$(grep -F '"TodoWrite"' "$transcript" 2>/dev/null | tail -1 | jq -c '
  .message.content[]?
  | select(.type == "tool_use" and .name == "TodoWrite")
  | .input.todos
' 2>/dev/null)

if [[ -n "$last_todos" && "$last_todos" != "null" ]]; then
  printf '%s\n' "$last_todos" | jq '.' > "$out"
  cp "$out" "$latest"
  count=$(printf '%s' "$last_todos" | jq 'length')
  echo "PreCompact: $count todos saved to $latest" >&2
fi

exit 0
