#!/bin/bash

# Přečti JSON ze stdin
input=$(cat)

# Parsuj informace (schema: tool_name / tool_input)
tool_name=$(echo "$input" | jq -r '.tool_name // "Unknown"')
detail=$(echo "$input" | jq -r '.tool_input.description // .tool_input.command // .tool_input.file_path // ""' | head -c 80)

# Urgentní notifikace s vyšší prioritou
osascript <<EOF
display notification "Claude potřebuje POVOLENÍ pro: $tool_name $detail" with title "⚠️ Claude Code - Vyžaduje pozornost" sound name "Sosumi"

-- Alternativně můžeš použít dialog pro ještě větší pozornost (zakomentované):
-- display dialog "Claude Code potřebuje tvoje povolení!" buttons {"OK"} default button "OK" with icon caution
EOF

exit 0
