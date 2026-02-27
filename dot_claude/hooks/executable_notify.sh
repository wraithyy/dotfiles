#!/bin/bash

# Přečti JSON ze stdin
input=$(cat)

# Parsuj informace o nástroji
tool_name=$(echo "$input" | jq -r '.toolName // "Unknown"')
tool_description=$(echo "$input" | jq -r '.args.description // ""')

# Různé notifikace podle nástroje
case "$tool_name" in
  "AskUserQuestion")
    osascript -e "display notification \"Claude se ptá na otázku\" with title \"Claude Code - Otázka\" sound name \"Glass\""
    ;;
  "Bash")
    if [ -n "$tool_description" ]; then
      osascript -e "display notification \"$tool_description\" with title \"Claude Code - Bash příkaz\" sound name \"Morse\""
    else
      osascript -e "display notification \"Spouští bash příkaz\" with title \"Claude Code\" sound name \"Morse\""
    fi
    ;;
  "Edit"|"Write")
    osascript -e "display notification \"Upravuje soubory\" with title \"Claude Code - Zápis\" sound name \"Pop\""
    ;;
  "Task")
    osascript -e "display notification \"Spouští podúlohu\" with title \"Claude Code - Task\" sound name \"Funk\""
    ;;
  *)
    osascript -e "display notification \"Používá nástroj: $tool_name\" with title \"Claude Code\" sound name \"default\""
    ;;
esac

exit 0
