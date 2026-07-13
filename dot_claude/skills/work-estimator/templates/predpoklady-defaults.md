# Globální předpoklady — Work Estimator Defaults

Tyto předpoklady platí pro celý odhad, pokud není u konkrétní položky uvedeno jinak.
Unikátní předpoklady k jednotlivým obrazovkám / komponentám mají vlastní ID (A-U001, A-U002, …).

## Globální předpoklady (A-G01 … A-G10)

| ID | Předpoklad |
|----|-----------|
| A-G01 | Figma design je finální, schválený a předán před zahájením implementace dané obrazovky |
| A-G02 | API specifikace (OpenAPI 3.x nebo Swagger) je poskytnuta ve formátu JSON/YAML před začátkem integrace |
| A-G03 | Klient zajišťuje DEV / STAGING / PROD prostředí včetně DNS, SSL a infra nákladů |
| A-G04 | Klient poskytne konfiguraci identity providera (OIDC/SAML metadata, client ID, client secret) |
| A-G05 | Datová komunikace probíhá v standardních formátech: ISO 8601 (datum/čas), UTF-8, RFC 3339 |
| A-G06 | Browser support: poslední 2 verze Chrome, Firefox, Safari, Edge — Internet Explorer není podporován |
| A-G07 | Cílová Lighthouse performance score ≥ 85 (mobilní zařízení, simulované 4G) |
| A-G08 | Baseline a11y: WCAG 2.1 AA — pokud nejsou stanoveny vyšší požadavky |
| A-G09 | Bugfix rezerva pro UAT fázi = 15 % z (FE obrazovky + cross-cutting FR + integrace), zaokrouhleno nahoru na 0.5 MD |
| A-G10 | Neznámý buffer = 10 % z celkového součtu MD, zaokrouhleno nahoru na 0.5 MD |

## Technické předpoklady (A-T01 … A-T05)

| ID | Předpoklad |
|----|-----------|
| A-T01 | Preferovaný tech stack: Vite + React + TypeScript (strict) + React Router v7, pokud nebude dohodnut TanStack Start |
| A-T02 | UI knihovna: MUI (Material UI) v5/v6, pokud klient nestanoví jinak |
| A-T03 | Server state: TanStack Query; lokální state: Zustand nebo Jotai |
| A-T04 | Forms: React Hook Form + Zod (default); TanStack Form jako alternativa na request |
| A-T05 | CI/CD: GitHub Actions (default); GitLab CI pokud klient používá GitLab |

## Jak přidat unikátní předpoklad

V tabulce obrazovek / integrací odkazuj jako `A-U001`, `A-U002`, atd.
Unikátní předpoklady zaznamenej na konci souboru `predpoklady.md` v sekci "Unikátní předpoklady".

Příklad:
```
A-U001: API endpoint /api/orders vrací max. 100 položek na stránku (backend řídí paginaci)
A-U002: SSO token má platnost 1 hodinu; silent renew via refresh token je podporováno
A-U003: Grafické podklady pro email šablony dodá grafický tým klienta
```
