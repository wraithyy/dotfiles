#!/bin/bash
# Unified Claude Code notification hook.
# Registered on: PermissionRequest, PreToolUse (AskUserQuestion), Stop.
# Platform dispatch: macOS (osascript, honors Focus/DND natively),
# WSL2 (wsl-notify-send.exe / BurntToast), Linux desktop (notify-send).
# Inside tmux, also paints a colored status-line message (visible fullscreen
# and the only visible channel on headless SSH sessions).

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

# escape double quotes for osascript/powershell string literals
esc() { echo "$1" | sed 's/"/\\"/g'; }

send_notification() {
  if command -v terminal-notifier >/dev/null 2>&1; then # macOS, preferred:
    # osascript notifications route through the Script Editor bundle, which
    # macOS silently drops unless manually allowed; terminal-notifier has its
    # own app bundle and prompts for permission on first run
    if [ -n "$sound" ]; then
      terminal-notifier -title "$title" -message "$message" -sound "$sound" 2>/dev/null
    else
      terminal-notifier -title "$title" -message "$message" 2>/dev/null
    fi
  elif command -v osascript >/dev/null 2>&1; then # macOS fallback
    if [ -n "$sound" ]; then
      osascript -e "display notification \"$(esc "$message")\" with title \"$(esc "$title")\" sound name \"$sound\"" 2>/dev/null
    else
      osascript -e "display notification \"$(esc "$message")\" with title \"$(esc "$title")\"" 2>/dev/null
    fi
  elif grep -qi microsoft /proc/version 2>/dev/null; then # WSL2 -> Windows toast
    if command -v wsl-notify-send.exe >/dev/null 2>&1; then
      wsl-notify-send.exe --category "$title" "$message" 2>/dev/null
    else
      powershell.exe -NoProfile -Command \
        "New-BurntToastNotification -Text '$(esc "$title")','$(esc "$message")'" 2>/dev/null
    fi
  elif command -v notify-send >/dev/null 2>&1; then # Linux desktop (RPi)
    notify-send "$title" "$message" 2>/dev/null
  fi
  # unknown platform: silently skip; tmux branch below still fires
}

send_notification

if [ -n "$TMUX" ]; then
  tmux display-message -d 3000 "#[bg=$tmux_color,fg=black] CC #[default] $message" 2>/dev/null
fi

exit 0
