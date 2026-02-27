#!/bin/bash

echo "Claude Code Hooks - Instalace"
echo "=============================="
echo ""
echo "Vyber variantu hooks:"
echo ""
echo "1) Základní - Pouze permission a otázky"
echo "2) Pokročilá - Všechny nástroje + kritické operace"
echo "3) Ultra - Kompletní tracking všech událostí"
echo "4) Smart - Inteligentní s detekcí Focus Mode a noční doby"
echo "5) Žádné hooks - Vrátit na původní nastavení"
echo ""
read -p "Tvá volba (1-5): " choice

case $choice in
  1)
    cp /Users/wraithy/.claude/settings-variants/basic-hooks.json /Users/wraithy/.claude/settings.json
    echo "✓ Nainstalována základní varianta"
    ;;
  2)
    cp /Users/wraithy/.claude/settings-variants/advanced-hooks.json /Users/wraithy/.claude/settings.json
    echo "✓ Nainstalována pokročilá varianta"
    ;;
  3)
    cp /Users/wraithy/.claude/settings-variants/ultra-advanced-hooks.json /Users/wraithy/.claude/settings.json
    echo "✓ Nainstalována ultra varianta"
    ;;
  4)
    cp /Users/wraithy/.claude/settings-variants/smart-hooks.json /Users/wraithy/.claude/settings.json
    echo "✓ Nainstalována smart varianta (s detekcí Focus Mode)"
    ;;
  5)
    echo '{"alwaysThinkingEnabled": true}' > /Users/wraithy/.claude/settings.json
    echo "✓ Hooks odstraněny"
    ;;
  *)
    echo "Neplatná volba!"
    exit 1
    ;;
esac

echo ""
echo "Hotovo! Restartuj Claude Code pro aktivaci hooks."
echo ""
echo "Pro přečtení dokumentace:"
echo "cat /Users/wraithy/.claude/hooks/README.md"
