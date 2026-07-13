#!/usr/bin/env bash
# Companion forward hook — forwards CC events to companion app
# Usage: companion-forward.sh <HookType>
# MUST always exit 0 — never block Claude Code

COMPANION_URL="http://127.0.0.1:4317/event"
HOOK_TYPE="${1:-unknown}"

# Read stdin
PAYLOAD=$(cat)

# Inject hook type into JSON payload (CC does not include it in stdin)
if [ -n "$PAYLOAD" ]; then
  ENRICHED=$(python3 -c "
import json, sys
d = json.loads(sys.argv[1])
d['hook'] = sys.argv[2]
print(json.dumps(d))
" "$PAYLOAD" "$HOOK_TYPE" 2>/dev/null)

  # Fall back to raw payload if python fails
  ENRICHED="${ENRICHED:-$PAYLOAD}"

  curl -s --max-time 1 \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$ENRICHED" \
    "$COMPANION_URL" \
    >/dev/null 2>&1 &
fi

exit 0
