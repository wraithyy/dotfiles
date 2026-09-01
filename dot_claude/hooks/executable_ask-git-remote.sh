#!/bin/bash
# Git/GitHub/GitLab write operations: prompt by default, opt-in per session
# with CLAUDE_GIT_YOLO=1 claude
#
# Why a hook and not permissions.ask: ask rules always prompt — they outrank
# allow rules, --allowedTools, a hook "allow" decision and even
# bypassPermissions mode. A hook is the only place the choice can be made per
# session. permissions.deny still applies on top of an "allow" decision here.

decide() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"%s","permissionDecisionReason":"%s"}}\n' "$1" "$2"
  exit 0
}

INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null)

if [ "$TOOL" = "Bash" ]; then
  COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)
  WRITE_RE='(^|[[:space:]]|;|&&|\|\|)(gh|glab)([[:space:]]|$)|(^|[[:space:]]|;|&&|\|\|)git[[:space:]]+(commit|push|merge|rebase|cherry-pick|revert|tag|stash)([[:space:]]|$)'
  echo "$COMMAND" | grep -qE "$WRITE_RE" || exit 0
fi

if [ -n "$CLAUDE_GIT_YOLO" ]; then
  decide allow "CLAUDE_GIT_YOLO set by the user for this session"
fi
decide ask "git/gh/glab write operation — user confirms"
