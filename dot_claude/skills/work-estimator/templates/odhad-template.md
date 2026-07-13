# Odhad: [NÁZEV PROJEKTU]

**Datum:** [DATUM]
**Confidence:** [HIGH / MEDIUM / LOW]
**Slug:** [slug]

---

## Souhrn

| Kategorie | MD |
|-----------|-----|
| Obrazovky (SCR) | X.0 |
| Funkční pož. cross-cutting (FR) | X.0 |
| Nefunkční pož. (NFR) | X.0 |
| Integrace zákazníka (INT) | X.0 |
| Architektura + DevOps (DEV) | X.0 |
| Bugfix / UAT rezerva (15 %) | X.0 |
| Buffer neznámé (10 %) | X.0 |
| **CELKEM** | **X.0 MD** |

---

## Globální předpoklady

Platí pro celý odhad pokud neurčeno jinak.

- Figma design finální + předán před impl. dané obrazovky
- API spec (OpenAPI) k dispozici před integrací
- Klient zajišťuje DEV/STAGING/PROD + DNS + SSL
- Klient dodá OIDC/SAML konfiguraci pro SSO
- Browser support: poslední 2 verze Chrome/FF/Safari/Edge; bez IE
- Lighthouse ≥ 85 mobile
- WCAG 2.1 AA baseline
- Bugfix UAT = 15 % z (SCR+FR+INT)
- Buffer = 10 % z celku

---

## Obrazovky (SCR)

| ID | Obrazovka | Funkčnost | MD | Předpoklady (unikátní) | Confidence |
|----|-----------|-----------|----|------------------------|------------|
| SCR-001 | Login | form + validace + SSO redirect | 2.0 | SSO OIDC redirect flow od klienta k dispozici | HIGH |
| SCR-002 | Dashboard | 4 widgety + lazy load | 3.0 | max 4 widgety dle Figmy; žádný real-time | HIGH |
| ... | | | | | |
| | **Subtotal SCR** | | **X.0** | | |

---

## Funkční požadavky cross-cutting (FR)

| ID | Požadavek | Detail | MD | Předpoklady (unikátní) |
|----|-----------|--------|----|------------------------|
| FR-001 | Projekt setup | Vite + TS + React Router v7 + MUI | 1.0 | |
| FR-002 | Theme MUI | custom tokeny + light mode | 1.5 | design tokeny v Figma Variables |
| FR-003 | i18n | cs + en, react-i18next + ICU | 2.0 | překlady dodá klient ve formátu JSON |
| FR-004 | Auth guard | protected routes + role check | 0.5 | role definice dodá BE team |
| ... | | | | |
| | **Subtotal FR** | | **X.0** | |

---

## Nefunkční požadavky (NFR)

| ID | Požadavek | Detail | MD | Předpoklady (unikátní) |
|----|-----------|--------|----|------------------------|
| NFR-001 | A11y WCAG 2.1 AA | axe-core audit + opravy | 1.0 | |
| ... | | | | |
| | **Subtotal NFR** | | **X.0** | |

---

## Integrace zákazníka (INT)

| ID | Integrace | Detail | MD | Předpoklady (unikátní) |
|----|-----------|--------|----|------------------------|
| INT-001 | OIDC SSO | PKCE flow + refresh + logout propagace | 2.5 | klient dodá IDP metadata + client ID/secret |
| INT-002 | REST /users | GET list + paginace, TQ hook + Zod schema | 1.0 | API spec dostupná; max 100 items/page |
| ... | | | | |
| | **Subtotal INT** | | **X.0** | |

---

## Architektura + DevOps (DEV)

| ID | Položka | Detail | MD |
|----|---------|--------|----|
| DEV-001 | Architektura | SPA Vite + React Router; bez monorepa (1 artefakt) | 0.0 |
| DEV-002 | GitHub Actions CI | typecheck + lint + build | 1.0 |
| DEV-003 | Preview deploys | Vercel per-PR URL | 1.0 |
| DEV-004 | Env management | .env.* struktura + dokumentace | 0.5 |
| ... | | | |
| | **Subtotal DEV** | | **X.0** |

---

## Bugfix / UAT rezerva

| ID | Položka | Výpočet | MD |
|----|---------|---------|-----|
| UAT-001 | Bugfix rezerva | 15 % z (SCR + FR + INT) = X.0 × 0.15 | X.0 |

---

## Buffer neznámé

| ID | Položka | Výpočet | MD |
|----|---------|---------|-----|
| BUF-001 | Neznámý buffer | 10 % z celku = X.0 × 0.10 | X.0 |

---

## Otevřené otázky (PENDING)

Pokud nejsou otázky: tato sekce chybí.

| ID | Otázka | Blokuje | Owner |
|----|--------|---------|-------|
| OQ-001 | Real-time na dashboard — WebSocket nebo polling? | SCR-002 | klient |
| ... | | | |

---

## Architektonická rozhodnutí

Viz `rozhodnuti.md` pro plný text. Shrnutí:

- SPA Vite + React Router (bez SSR — žádné SEO požadavky)
- MUI v6 (default, klient nespecifikoval jinak)
- TanStack Query + Zustand
- GitHub Actions CI
- Bez monorepa (1 deploy artefakt)
