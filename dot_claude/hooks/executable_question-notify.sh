#!/bin/bash

# Přečti JSON ze stdin
input=$(cat)

# Získej první otázku pokud existuje
question=$(echo "$input" | jq -r '.args.questions[0].question // "Claude se na něco ptá"' | head -c 100)

# Notifikace s textem otázky
osascript -e "display notification \"$question\" with title \"❓ Claude Code - Otázka\" sound name \"Glass\""

# Můžeš také přidat zvuk navíc pro větší upozornění
afplay /System/Library/Sounds/Glass.aiff

exit 0
