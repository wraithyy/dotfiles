#!/bin/bash

echo "Test macOS notifikací pro Claude Code"
echo "======================================"
echo ""

# Test 1: Základní notifikace
echo "1. Testuji základní notifikaci..."
osascript -e 'display notification "Test základní notifikace" with title "Claude Code Test" sound name "Glass"'
sleep 2

# Test 2: Urgentní notifikace
echo "2. Testuji urgentní notifikaci..."
osascript -e 'display notification "Test urgentní notifikace" with title "Claude Code - URGENTNÍ" sound name "Sosumi"'
sleep 2

# Test 3: Notifikace s různými zvuky
echo "3. Testuji různé zvuky..."
for sound in "Pop" "Funk" "Hero" "Submarine"; do
  echo "   - Zvuk: $sound"
  osascript -e "display notification \"Test zvuku $sound\" with title \"Claude Code\" sound name \"$sound\""
  sleep 1.5
done

# Test 4: Notifikace s dlouhým textem
echo "4. Testuji notifikaci s dlouhým textem..."
osascript -e 'display notification "Toto je hodně dlouhá notifikace která testuje jak macOS zobrazuje delší text v notifikacích a jestli ho ořízne nebo zobrazí celý" with title "Claude Code - Dlouhý text"'
sleep 2

# Test 5: Multiple notifikace najednou
echo "5. Testuji několik notifikací najednou..."
osascript -e 'display notification "První notifikace" with title "Claude Code 1"' &
osascript -e 'display notification "Druhá notifikace" with title "Claude Code 2"' &
osascript -e 'display notification "Třetí notifikace" with title "Claude Code 3"' &
wait
sleep 2

echo ""
echo "Test dokončen! Viděl jsi všechny notifikace?"
