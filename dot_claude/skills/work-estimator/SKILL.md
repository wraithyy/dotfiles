---
name: work-estimator
description: FE estimation skill. Zpracovává zadání z Excel/Word/PDF/MD/TXT/Figma, iterativně se doptává, a generuje strukturované odhady v Man-Dnech (min. 0.5 MD) jako XLSX + Markdown. Preferovaný stack: SPA (Vite + React Router) + MUI. Deleguje estimaci na agenta fe-estimator.
---

# Work Estimator Skill

Orchestrační skill pro tvorbu FE odhadů. Čte heterogenní zadání, koordinuje parsování souborů, řídí workflow doptávání, a orchestruje generování výstupního `.xlsx` + `.md` přes agenta `fe-estimator`.

## Trigger

Aktivuj tento skill když:
- Uživatel říká "odhad", "estimate", "estimace", "naceň", "naodhaduj", "MD odhad"
- Uživatel poskytuje zadání k projektu (text, soubory, Figma link)
- Uživatel spustí `/estimate`

## Workflow (6 fází)

### Fáze 1: Material Intake

Urči co bylo poskytnuto a načti vše:

```
.xlsx / .xls    → Node.js skript ~/.claude/skills/work-estimator/scripts/parse-input.mjs (mode: excel)
.docx           → Node.js skript (mode: docx)
.pdf            → Node.js skript (mode: pdf)
.md / .txt      → Read tool přímo
.png / .jpg     → Read tool (vision)
Figma URL       → MCP figma-developer-mcp (pokud dostupný) NEBO požádat o PNG/PDF export
```

**Kontrola Figma MCP:**
```bash
claude mcp list 2>/dev/null | grep -i figma
```
Pokud chybí → informuj uživatele:
> "Figma MCP není nainstalován. Exportuj obrazovky jako PNG nebo PDF a poskytni je. Nebo nainstaluj MCP: `claude mcp add figma --scope user -- npx -y figma-developer-mcp --figma-api-key=<TOKEN>`"

**Kontrola Node.js závislostí:**
```bash
node -e "require('exceljs'); require('mammoth'); require('pdf-parse')" 2>/dev/null \
  || echo "MISSING"
```
Pokud MISSING:
```bash
cd ~/.claude/skills/work-estimator && npm install exceljs mammoth pdf-parse --save
```

**Ohlášení co bylo načteno (caveman):**
```
Načteno: zadani.docx (Word), requirements.pdf (PDF), figma-export.png (obr.)
Figma MCP: nedostupný — pracuji s exportem.
Přecházím na klasifikaci.
```

### Fáze 2: Klasifikace

Deleguj na `fe-estimator` agenta:
- Klasifikuj každý požadavek: `[SCR]` / `[FR]` / `[NFR]` / `[INT]` / `[DEV]` / `[UAT]`
- Identifikuj nejasnosti → seznam pro doptávání

### Fáze 3: Iterativní doptávání

Agent `fe-estimator` vede doptávání. Skill koordinuje:
- Zobraz otázky uživateli
- Čekej na odpovědi
- Iteruj dokud uživatel nepotvrdí ("stačí", "jdeme dál", "ok")
- Nezodpovězené otázky → uložit jako `PENDING_CLIENT`

**Bez `--no-questions` flagu: doptávání je POVINNÉ před outputem.**

### Fáze 4: Architektonická rozhodnutí

Agent `fe-estimator` rozhoduje a zaznamenává v `rozhodnuti.md`.
Skill informuje uživatele o klíčových rozhodnutích před estimací.

### Fáze 5: Estimace

Agent generuje JSON strukturu odhadů. Skill validuje:
- Každá MD hodnota ≥ 0.5
- Každá MD hodnota je násobek 0.5
- Globální předpoklady sdílené, unikátní jen kde nutné

### Fáze 6: Output generování

```bash
# Vytvoř výstupní adresář
mkdir -p docs/estimates/[slug]

# Spusť XLSX generátor
node ~/.claude/skills/work-estimator/scripts/build-xlsx.mjs \
  --input /tmp/estimate-data.json \
  --output docs/estimates/[slug]/odhad.xlsx

# Markdown výstup generuje agent přes Write tool
```

Výsledek oznám uživateli:
```
Výstup připraven:
- docs/estimates/[slug]/odhad.xlsx
- docs/estimates/[slug]/odhad.md
- docs/estimates/[slug]/predpoklady.md
- docs/estimates/[slug]/rozhodnuti.md
[pokud existují PENDING otázky]:
- docs/estimates/[slug]/otazky.md — X otázek čeká na odpověď klienta
```

## Delegace na fe-estimator agenta

Spusť agenta s kontextem:
```
Spouštím fe-estimator agenta. Přidej do promptu:
- klasifikované požadavky ze Fáze 2
- odpovědi na otázky ze Fáze 3
- rozhodnutí ze Fáze 4
- instrukce k výstupnímu formátu (JSON pro build-xlsx.mjs + MD soubory)
```

## Pravidla

- **Jazyk:** pouze čeština
- **Komunikace:** caveman mode — fragmenty, bez fluffu, tech termíny přesné
- **Min. MD:** 0.5 — validováno v build-xlsx.mjs
- **Předpoklady:** načíst defaults z `~/.claude/skills/work-estimator/templates/predpoklady-defaults.md`
- **Knowledge base:** viz `~/.claude/skills/work-estimator/knowledge/fe-baseline-md.md`
- **Testing:** pouze pokud uživatel explicitně řekne "chci odhad testování"
- **Bugfix/UAT:** vždy zahrnout jako 15 % z FE+integrace (zaokrouhlit na 0.5 nahoru)
- **Buffer:** vždy zahrnout jako 10 % z celku (zaokrouhlit na 0.5 nahoru)

## Soubory tohoto skillu

```
~/.claude/skills/work-estimator/
├── SKILL.md                           # tento soubor
├── scripts/
│   ├── build-xlsx.mjs                 # exceljs XLSX generátor
│   └── parse-input.mjs                # parser router (Excel/Word/PDF)
├── templates/
│   ├── odhad-template.md              # šablona narrative MD
│   └── predpoklady-defaults.md        # globální default předpoklady
└── knowledge/
    └── fe-baseline-md.md              # baseline MD per typ komponenty/obrazovky
```

## Chybové stavy

| Situace | Akce |
|---------|------|
| Figma MCP chybí | Informuj, nabídni fallback PNG/PDF |
| exceljs chybí | Auto-install nebo fallback na Markdown only |
| Soubor nelze parsovat | Informuj, požádat o jiný formát nebo paste textu |
| Žádné materiály neposkytnuty | Požádat: "Kde jsou zadání? Přilož soubory nebo popis." |
| Odhad <0.5 MD | Zaokrouhlit na 0.5, zalogovat warning v odhad.md |
