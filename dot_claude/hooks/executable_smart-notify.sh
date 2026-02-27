#!/bin/bash

# Pokročilá inteligentní notifikace s detekcí Focus Mode a dalšími featury

input=$(cat)

tool_name=$(echo "$input" | jq -r '.toolName // "Unknown"')
tool_description=$(echo "$input" | jq -r '.args.description // ""')

# Funkce pro kontrolu Focus Mode (Do Not Disturb)
is_focus_mode() {
  # Zkontroluj jestli je aktivní Focus Mode
  defaults read com.apple.controlcenter "NSStatusItem Visible FocusModes" 2>/dev/null | grep -q "1"
  return $?
}

# Funkce pro získání času
get_hour() {
  date +%H
}

# Funkce pro prioritu notifikace
get_priority() {
  case "$tool_name" in
    "AskUserQuestion") echo "critical" ;;
    "Bash")
      if echo "$input" | jq -r '.args.command' | grep -qE "rm -rf|git push.*--force|sudo"; then
        echo "critical"
      else
        echo "normal"
      fi
      ;;
    "Edit"|"Write") echo "low" ;;
    *) echo "normal" ;;
  esac
}

priority=$(get_priority)
hour=$(get_hour)

# Rozhodnutí jestli notifikovat
should_notify=true

# Nenotifikovat v noci (23:00 - 7:00) pro low priority
if [ "$priority" == "low" ] && ([ "$hour" -ge 23 ] || [ "$hour" -lt 7 ]); then
  should_notify=false
fi

# Nenotifikovat během Focus Mode pro normal priority
if [ "$priority" == "normal" ] && is_focus_mode; then
  should_notify=false
fi

# Critical priority notifikace VŽDY projdou
if [ "$priority" == "critical" ]; then
  should_notify=true
fi

# Odeslání notifikace pokud je povolena
if [ "$should_notify" == "true" ]; then
  case "$priority" in
    "critical")
      osascript -e "display notification \"⚠️ VYŽADUJE POZORNOST: $tool_name\" with title \"Claude Code - KRITICKÉ\" sound name \"Sosumi\""
      afplay /System/Library/Sounds/Sosumi.aiff
      ;;
    "normal")
      message="$tool_name"
      if [ -n "$tool_description" ]; then
        message="$tool_description"
      fi
      osascript -e "display notification \"$message\" with title \"Claude Code\" sound name \"Glass\""
      ;;
    "low")
      osascript -e "display notification \"$tool_name\" with title \"Claude Code\""
      # Žádný zvuk pro low priority
      ;;
  esac
fi

exit 0
