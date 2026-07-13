#!/bin/bash
# Unified Claude Code notification hook.
# Registered on: PermissionRequest, PreToolUse (AskUserQuestion), Stop.
# macOS notification center honors Focus/DND natively — no custom detection.
# Inside tmux, also paints a colored status-line message (visible fullscreen).

input=$(cat)

event=$(echo "$input" | jq -r '.hook_event_name // ""')
tool_name=$(echo "$input" | jq -r '.tool_name // ""')
cwd=$(echo "$input" | jq -r '.cwd // ""')
project=$(basename "${cwd:-?}")
hour=$(date +%H)

title=""
message=""
sound=""
tmux_color="green"

case "$event" in
  PermissionRequest)
    detail=$(echo "$input" | jq -r '.tool_input.description // .tool_input.command // .tool_input.file_path // ""' | head -c 80)
    title="Claude Code – povolení"
    message="$tool_name: ${detail:-$project}"
    sound="Sosumi"
    tmux_color="yellow"
    ;;
  PreToolUse)
    [ "$tool_name" = "AskUserQuestion" ] || exit 0
    question=$(echo "$input" | jq -r '.tool_input.questions[0].question // "Claude se ptá"' | head -c 100)
    title="Claude Code – otázka"
    message="$question"
    sound="Glass"
    tmux_color="blue"
    ;;
  Stop)
    # night quiet for completion pings; permission/question always pass
    if [ "$hour" -ge 23 ] || [ "$hour" -lt 7 ]; then exit 0; fi
    title="Claude Code"
    message="Hotovo: $project"
    sound="Glass"
    tmux_color="green"
    ;;
  Notification)
    message=$(echo "$input" | jq -r '.message // "Claude Code"' | head -c 120)
    title="Claude Code"
    ;;
  *)
    exit 0
    ;;
esac

# escape double quotes for osascript string literal
esc() { echo "$1" | sed 's/"/\\"/g'; }

if [ -n "$sound" ]; then
  osascript -e "display notification \"$(esc "$message")\" with title \"$(esc "$title")\" sound name \"$sound\"" 2>/dev/null
else
  osascript -e "display notification \"$(esc "$message")\" with title \"$(esc "$title")\"" 2>/dev/null
fi

if [ -n "$TMUX" ]; then
  tmux display-message -d 3000 "#[bg=$tmux_color,fg=black] CC #[default] $message" 2>/dev/null
fi

exit 0
