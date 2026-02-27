#!/bin/bash

# Přečti JSON ze stdin
input=$(cat)

# Parsuj informace
tool_name=$(echo "$input" | jq -r '.toolName // "Unknown"')
permission_type=$(echo "$input" | jq -r '.permissionType // ""')

# Urgentní notifikace s vyšší prioritou
osascript <<EOF
display notification "Claude potřebuje POVOLENÍ pro: $tool_name" with title "⚠️ Claude Code - Vyžaduje pozornost" sound name "Sosumi"

-- Alternativně můžeš použít dialog pro ještě větší pozornost (zakomentované):
-- display dialog "Claude Code potřebuje tvoje povolení!" buttons {"OK"} default button "OK" with icon caution
EOF

exit 0
