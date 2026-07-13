---
description: Zpracuj zadání (Excel, Word, PDF, TXT, MD, Figma) a vytvoř FE odhady v MD (min. 0.5 MD) + XLSX výstup. Doptává se iterativně. Výstup do docs/estimates/[nazev]/.
---

# /estimate — FE Estimation Command

Spustí workflow pro tvorbu FE odhadů. Deleguje na skill `work-estimator` a agenta `fe-estimator`.

## Použití

```
/estimate [materiály / cesty / text]
```

**Příklady:**
```
/estimate zadani.docx requirements.pdf
/estimate https://figma.com/file/...
/estimate Potřebuju odhad na portál pro správu objednávek se 4 obrazovkami
/estimate zadani.xlsx figma-export.png
```

## Co skill dělá

1. Načte všechny poskytnuté materiály (Excel/Word/PDF/MD/TXT/Figma/PNG)
2. Klasifikuje požadavky ([SCR] / [FR] / [NFR] / [INT] / [DEV] / [UAT])
3. Iterativně se doptává — **nespěchej na output, otázky jsou chtěná funkcionalita**
4. Rozhodne o architektuře (monorepo, SPA vs SSR, MUI, CI/CD)
5. Vygeneruje odhady v MD (min 0.5 MD/položka)
6. Vytvoří `docs/estimates/[slug]/odhad.xlsx` + Markdown sadu

## Výstupní soubory

```
docs/estimates/[slug]/
├── odhad.xlsx          # hlavní klientský výstup (exceljs)
├── odhad.md            # narrative + tabulky (caveman-style)
├── predpoklady.md      # globální předpoklady + unikátní
├── otazky.md           # PENDING_CLIENT otázky
└── rozhodnuti.md       # architektonická rozhodnutí s odůvodněním
```

## XLSX listy

| List | Obsah |
|------|-------|
| Souhrn | celkový součet MD (FE / Integrace / CI-CD / Bugfix / Buffer) |
| Obrazovky | 1 řádek = 1 screen, MD + předpoklady |
| Funkční pož. | cross-cutting FR (routing, theme, i18n, auth guard, …) |
| Nefunkční pož. | a11y, perf, SEO, security |
| Integrace | API, SSO, datové mapování |
| Architektura+DevOps | monorepo, CI/CD, preview deploys |
| Bugfix/UAT | 15 % z FE+integrace (default) |
| Předpoklady | centralizovaná tabulka A-G01…A-Uxx |

## Pravidla

- Min. 0.5 MD / položka
- Globální předpoklady centrálně, unikátní jen kde nutné
- Doptávání PŘED outputem
- Jazyk výstupu: čeština
- Komunikace: caveman mode
- Testing scope: jen na explicitní request

## Závislosti

- **Node.js runtime** pro XLSX generování
- Balíčky (auto-install pokud chybí): `exceljs`, `mammoth`, `pdf-parse`
- **Figma MCP** (volitelné) — bez něj skill požádá o PNG/PDF export

## Instalace Figma MCP (volitelné)

```bash
claude mcp add figma --scope user -- npx -y figma-developer-mcp --figma-api-key=<TOKEN>
```

Potom přidej do `~/.claude/rules/mcp.md` jako aktivní server.

## Argumenty

$ARGUMENTS — libovolná kombinace:
- cesty k souborům (`.xlsx`, `.docx`, `.pdf`, `.md`, `.txt`, `.png`, `.jpg`)
- Figma URL
- volný text popisující požadavky
- `--slug nazev` pro přepsání výstupního adresáře
- `--no-questions` pro skip doptávání (vhodné pro jednoduché scénáře)
