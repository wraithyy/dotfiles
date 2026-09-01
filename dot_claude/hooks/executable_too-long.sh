#!/bin/bash
# Stop hook: if the final reply to the user runs long, send Claude back to
# say it shorter. Adapted from codyssey-tools too-long.sh. Counts words in
# the final text block of the last assistant message; over the limit returns
# {"decision":"block","reason":...}. Second pass always passes because
# stop_hook_active is set by then. Costs one extra turn when it fires.
#
# Off:      export TOO_LONG_LIMIT=0
# Stricter: export TOO_LONG_LIMIT=120
set -u

LIMIT="${TOO_LONG_LIMIT:-350}"

case "$LIMIT" in ''|*[!0-9]*|0) exit 0 ;; esac
command -v jq >/dev/null 2>&1 || exit 0

input=$(cat 2>/dev/null)
active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)

[ "$active" = "true" ] && exit 0
[ -n "$transcript" ] && [ -f "$transcript" ] || exit 0

# Only count a reply that comes after the last user/tool entry; the final
# message may not be flushed yet, so retry up to 2s.
count_last_reply() {
  jq -rs '
    to_entries as $e
    | (($e | map(select(.value.type == "user"))      | last | .key) // -1) as $u
    | (($e | map(select(.value.type == "assistant")) | last | .key) // -1) as $a
    | if $a > $u
      then [ $e[$a].value.message.content[]? | select(.type == "text") | .text ] | join(" ")
      else "" end
  ' "$transcript" 2>/dev/null | wc -w | tr -d ' '
}

words=0
i=0
while [ "$i" -lt 20 ]; do
  words=$(count_last_reply)
  case "$words" in ''|*[!0-9]*) words=0 ;; esac
  [ "$words" -gt 0 ] && break
  i=$((i + 1))
  sleep 0.1
done

case "$words" in ''|*[!0-9]*) exit 0 ;; esac

if [ "$words" -gt "$LIMIT" ]; then
  reason=$(printf '%s\n' \
    "Odpověď je moc dlouhá: $words slov (limit $LIMIT)." \
    "Přepiš ji: výsledek první větou, jen fakta co mění další krok," \
    "žádné rekapitulace procesu ani feature tours." \
    "Překroč limit jen když to odpověď skutečně vyžaduje (výpisy, reporty na vyžádání).")
  jq -nc --arg r "$reason" '{decision:"block", reason:$r}'
fi
exit 0
