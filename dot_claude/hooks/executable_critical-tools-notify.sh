#!/bin/bash

# Notifikace pro kritické operace (mazání, git push apod.)
input=$(cat)

tool_name=$(echo "$input" | jq -r '.toolName // "Unknown"')
command=$(echo "$input" | jq -r '.args.command // ""')

# Zkontroluj jestli jde o nebezpečnou operaci
is_dangerous=false

if [[ "$tool_name" == "Bash" ]]; then
  if [[ "$command" =~ rm\ -rf ]] || [[ "$command" =~ git\ push ]] || [[ "$command" =~ --force ]]; then
    is_dangerous=true
  fi
fi

if [ "$is_dangerous" = true ]; then
  # Urgentní notifikace pro nebezpečné operace
  osascript -e "display notification \"POZOR: Nebezpečná operace!\" with title \"🚨 Claude Code - KRITICKÉ\" sound name \"Basso\""

  # Přehrát zvuk 2x pro jistotu
  afplay /System/Library/Sounds/Basso.aiff &
  sleep 0.5
  afplay /System/Library/Sounds/Basso.aiff
fi

exit 0
