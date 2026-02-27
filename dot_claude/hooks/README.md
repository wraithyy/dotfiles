# Claude Code Hooks - Pokročilé varianty notifikací

## Vytvořené skripty

### 1. `notify.sh`
Inteligentní notifikace podle typu nástroje:
- Různé zvuky pro různé nástroje
- Zobrazuje popis operace
- Parsuje JSON ze stdin

### 2. `permission-notify.sh`
Urgentní notifikace pro permission requesty:
- Vyšší priorita
- Výrazný zvuk (Sosumi)
- Zobrazuje, pro jaký nástroj je povolení potřeba

### 3. `question-notify.sh`
Notifikace pro otázky od Claude:
- Zobrazuje text první otázky (prvních 100 znaků)
- Přehraje zvuk Glass
- Extra afplay pro jistotu

### 4. `critical-tools-notify.sh`
Varování před nebezpečnými operacemi:
- Detekuje `rm -rf`, `git push --force` apod.
- Přehraje urgentní zvuk 2x
- Kritická notifikace

### 5. `smart-notify.sh`
Inteligentní notifikace s kontextovým chováním:
- Detekuje macOS Focus Mode (Do Not Disturb)
- Respektuje noční dobu (23:00 - 7:00)
- Třístupňová priorita: critical, normal, low
- Critical notifikace VŽDY projdou
- Normal notifikace respektují Focus Mode
- Low notifikace se neposílají v noci

## Konfigurace varianty

### Varianta A: Základní (basic-hooks.json)
```bash
cp /Users/wraithy/.claude/settings-variants/basic-hooks.json /Users/wraithy/.claude/settings.json
```
**Obsahuje:**
- Notifikace při permission requestech
- Notifikace při otázkách

### Varianta B: Pokročilá (advanced-hooks.json)
```bash
cp /Users/wraithy/.claude/settings-variants/advanced-hooks.json /Users/wraithy/.claude/settings.json
```
**Obsahuje:**
- Vše z varianty A
- Notifikace pro všechny nástroje s detaily
- Varování před kritickými operacemi
- Notifikace po dokončení Task

### Varianta C: Ultra (ultra-advanced-hooks.json)
```bash
cp /Users/wraithy/.claude/settings-variants/ultra-advanced-hooks.json /Users/wraithy/.claude/settings.json
```
**Obsahuje:**
- Vše z varianty B
- Notifikace při startu session
- Detailní notifikace s názvy souborů při Edit/Write
- Notifikace s popisem Task
- Status notifikace po Bash příkazech
- Notifikace když Claude dokončí odpověď (Stop event)

### Varianta D: Smart (smart-hooks.json) - DOPORUČENO
```bash
cp /Users/wraithy/.claude/settings-variants/smart-hooks.json /Users/wraithy/.claude/settings.json
```
**Obsahuje:**
- Inteligentní notifikace s detekcí Focus Mode
- Respektuje noční dobu (23:00 - 7:00)
- Třístupňová priorita (critical/normal/low)
- Critical notifikace VŽDY projdou (AskUserQuestion, nebezpečné Bash příkazy)
- Normal notifikace respektují Focus Mode
- Low notifikace (Edit/Write) se neposílají v noci
- Nejlepší varianta pro běžné použití

## Dostupné macOS zvuky

- **Basso** - Hluboký, urgentní
- **Blow** - Výrazný
- **Bottle** - Jemný
- **Frog** - Zvláštní
- **Funk** - Veselý
- **Glass** - Čistý, příjemný
- **Hero** - Vítězný
- **Morse** - Technický
- **Ping** - Krátký
- **Pop** - Rychlý
- **Purr** - Jemný
- **Sosumi** - Klasický, urgentní
- **Submarine** - Hluboký

Poslechnout zvuk: `afplay /System/Library/Sounds/Glass.aiff`

## Vlastní úpravy

Můžeš kombinovat různé části nebo vytvořit vlastní:

```bash
# Edituj aktuální settings
nano /Users/wraithy/.claude/settings.json

# Nebo vytvoř vlastní hook skript
nano /Users/wraithy/.claude/hooks/my-custom-hook.sh
chmod +x /Users/wraithy/.claude/hooks/my-custom-hook.sh
```

## Tip: Podmíněné notifikace

Můžeš v skriptech přidat podmínky:
```bash
# Notifikace pouze pro určité projekty
if [[ "$CLAUDE_PROJECT_DIR" == *"important-project"* ]]; then
  osascript -e 'display notification "Důležitý projekt!" with title "Claude"'
fi
```

## Testování

Aktivuj hook a zkus:
```bash
# Claude by měl zobrazit notifikaci při použití Bash nástroje
echo "test"
```
