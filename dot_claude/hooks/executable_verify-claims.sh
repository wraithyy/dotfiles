#!/bin/bash
# Stop hook: claim-without-evidence guard. If the final assistant message
# claims tests/verification passed but no test runner was actually executed
# (tool_use Bash commands in the recent transcript), exit 2 once per session
# to demand real evidence.

input=$(cat)
command -v jq >/dev/null 2>&1 || exit 0

session_id=$(echo "$input" | jq -r '.session_id // "unknown"')
transcript=$(echo "$input" | jq -r '.transcript_path // ""')
active=$(echo "$input" | jq -r '.stop_hook_active // false')

[[ "$active" == "true" ]] && exit 0
[[ -z "$transcript" || ! -f "$transcript" ]] && exit 0

# Final message may not be flushed to the transcript yet when Stop fires —
# retry briefly (same race as codyssey too-long.sh).
last_reply() {
  jq -rs '
    to_entries as $e
    | (($e | map(select(.value.type == "user"))      | last | .key) // -1) as $u
    | (($e | map(select(.value.type == "assistant")) | last | .key) // -1) as $a
    | if $a > $u
      then [ $e[$a].value.message.content[]? | select(.type == "text") | .text ] | join(" ")
      else "" end
  ' "$transcript" 2>/dev/null
}

last_msg=""
for _ in $(seq 1 10); do
  last_msg=$(last_reply)
  [[ -n "$last_msg" ]] && break
  sleep 0.1
done
[[ -z "$last_msg" ]] && exit 0

claim_re='(testy? (pro|prob|pass)|tests? pass|all tests|všechny testy|ověřeno|verified|✅)'
echo "$last_msg" | grep -qiE "$claim_re" || exit 0

# Evidence = a test runner actually executed via Bash tool_use in the last
# 200 transcript entries (mentions in prose don't count).
evidence_re='(vitest|pnpm (run )?test|npm (run )?test|yarn test|playwright test|jest|pytest|go test|cargo test|tsc --noEmit)'
ran=$(jq -rs '.[-200:] | [ .[] | select(.type=="assistant")
  | .message.content[]? | select(.type=="tool_use" and .name=="Bash")
  | .input.command // "" ] | join("\n")' "$transcript" 2>/dev/null)
echo "$ran" | grep -qE "$evidence_re" && exit 0

marker="/tmp/claude-verify-claims-$session_id"
[[ -f "$marker" ]] && exit 0
touch "$marker"

echo "Poslední zpráva tvrdí prošlé testy/ověření, ale v transcriptu není žádný skutečně spuštěný test runner. Buď testy spusť a doplň exit code + poslední řádky outputu, nebo claim označ jako UNVERIFIED." >&2
exit 2
