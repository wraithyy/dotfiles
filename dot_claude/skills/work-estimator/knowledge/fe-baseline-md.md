# FE Baseline MD — Knowledge Base

Referenční tabulky pro agenta `fe-estimator`. Min. jednotka = 0.5 MD. Všechny hodnoty jsou násobky 0.5.

## Obrazovky (SCR)

| Typ obrazovky | Min | Typ | Max | Podmínky pro navýšení |
|--------------|-----|-----|-----|----------------------|
| Login / Email+heslo | 1.0 | 1.5 | 2.5 | +0.5 SSO redirect, +0.5 MFA, +0.5 "zapamatovat si" |
| Registrace (jednokroková) | 1.5 | 2.0 | 3.0 | +0.5 email verifikace, +0.5 complex validace |
| Onboarding (multi-step wizard) | 2.0 | 3.0 | 5.0 | +0.5/krok nad 2, +1.0 pokud upload dokumentů |
| Dashboard — informační (read-only widgety) | 2.0 | 3.0 | 5.0 | +0.5/widget, +1.0 real-time, +0.5 resizable layout |
| Seznam / tabulka (základní) | 1.0 | 1.5 | 2.5 | +0.5 inline edit, +0.5 export CSV/XLSX, +0.5 bulk actions |
| Seznam s rozšířeným filtrováním | 1.5 | 2.0 | 3.5 | +0.5 fulltext, +0.5 facety/multi-select, +0.5 uložené filtry |
| Detail entity (read-only) | 1.0 | 1.5 | 2.0 | +0.5 tab layout, +0.5 auditní log / timeline |
| Detail entity (s editací) | 1.5 | 2.0 | 3.0 | +0.5 inline vs. edit-mode toggle, +0.5 optimistic updates |
| Formulář vytvoření (jednoduchý <8 polí) | 1.5 | 2.0 | 2.5 | +0.5 závislá pole (conditional), +0.5 async validace |
| Formulář vytvoření (komplexní ≥8 polí) | 2.0 | 3.0 | 5.0 | +0.5/extra sekce, +1.0 multi-step, +0.5 file upload |
| Vyhledávání / Search results | 1.0 | 1.5 | 2.5 | +0.5 highlight, +0.5 navigable results, +0.5 AI search |
| Nastavení / Profil uživatele | 1.0 | 1.5 | 2.5 | +0.5 notifikace, +0.5 API klíče/tokeny, +0.5 avatar upload |
| Reporting (statické grafy) | 2.0 | 3.0 | 4.0 | +0.5/graf nad 2, +1.0 interaktivní drill-down |
| Reporting (dynamické / export) | 3.0 | 4.0 | 6.0 | +0.5 PDF export, +0.5 scheduling, +1.0 custom builder |
| Map view (Leaflet / Mapbox) | 2.0 | 3.0 | 5.0 | +0.5 clustering, +1.0 drawing/editing, +0.5 layers |
| Kanban board | 2.5 | 3.5 | 5.0 | +0.5 drag-and-drop, +0.5 swimlanes, +0.5 WIP limity |
| Calendar view | 2.0 | 3.0 | 4.5 | +0.5 monthly/weekly/daily toggle, +0.5 DnD events |
| Chat / messaging UI | 2.5 | 4.0 | 6.0 | +1.0 real-time (WebSocket), +0.5 media, +0.5 reactions |
| Landing / marketing page | 1.0 | 2.0 | 3.5 | +0.5 animace, +0.5 video hero, +0.5 A/B sekce |
| Error pages (404, 500, 403) | 0.5 | 0.5 | 1.0 | per stránka, +0.5 pokud custom branded design |
| Email šablona | 0.5 | 1.0 | 1.5 | per šablona — HTML email kompatibilita je složitá |
| PDF template (React PDF) | 1.0 | 1.5 | 2.5 | +0.5 komplexní layout, +0.5 dynamické tabulky |
| Tiskový pohled | 0.5 | 1.0 | 1.5 | CSS @media print |

## Cross-cutting funkční požadavky (FR)

| FR | Popis | MD | Podmínky |
|----|-------|----|----------|
| Projekt setup (Vite + TS + RR) | scaffolding, tsconfig, paths, env | 1.0 | baseline SPA |
| Projekt setup (TanStack Start) | SSR mode, server functions, streaming | 2.0 | +1.0 vs. Vite SPA |
| Monorepo setup (pnpm workspaces) | workspaces, tsconfig refs, shared deps | 1.5 | pokud ≥2 artefakty |
| MUI theme customization | color tokens, typography, component overrides | 1.5 | +0.5 dark mode, +0.5 RTL |
| State management setup | TanStack Query config, devtools, Zustand/Jotai | 1.0 | baseline |
| Auth guard / route protection | PrivateRoute, role-based guards | 0.5 | per route group |
| i18n setup (react-i18next) | detekce jazyka, namespace split, ICU formáty | 1.5 | +0.5/jazyk nad 2 |
| A11y baseline (WCAG 2.1 AA) | fokus management, ARIA, skip links, color contrast | 1.0 | auto pro EU veřejný sektor |
| SEO meta + OpenGraph | react-helmet nebo framework meta, sitemap | 1.0 | pokud public pages |
| Error boundary setup | per-route boundary, fallback UI, Sentry integration | 0.5 | doporučeno vždy |
| Loading skeleton system | Skeleton komponenty pro data-heavy views | 1.0 | dle počtu views (>4 → 1.5) |
| Form setup (RHF + Zod) | global form config, custom components, error messages | 0.5 | per projekt, ne per form |
| Notification / Toast system | react-hot-toast nebo MUI Snackbar, global queue | 0.5 | |
| Modal / Dialog system | global modal manager, portals | 0.5 | pokud >3 modálů |
| Table library setup (MUI DataGrid / TanStack Table) | setup, custom renderers, sorting/filtering | 1.0 | pokud ≥2 tabulky v projektu |
| Rich text editor (TipTap / Quill) | setup + custom extensions | 1.5 | per editor instance |
| File upload system | drag-and-drop, progress, validace typů, preview | 1.5 | +0.5 multifile, +0.5 image crop |
| Offline / PWA podpora | Service Worker, cache strategy, install prompt | 2.0 | pouze na explicitní request |

## Integrace zákazníka (INT)

| INT | Popis | MD | Podmínky |
|-----|-------|----|----------|
| OIDC SSO (redirect flow) | PKCE, token store, refresh | 2.0 | +0.5 silent renew, +0.5 logout propagation, +0.5 multi-tenant |
| REST API — jednoduchý endpoint | GET/POST, TQ hook, typy | 0.5 | per endpoint (standardní CRUD) |
| REST API — komplexní endpoint | transformace, chybové stavy, retry | 1.0 | per endpoint |
| REST API — celá doménová entita | CRUD suite (list+detail+create+edit+delete) | 2.5 | +0.5 optimistic updates |
| GraphQL klient setup (Apollo / urql) | client config, cache, codegen | 2.0 | +0.5 subscriptions |
| WebSocket / Server-Sent Events | connection mgmt, reconnect, UI sync | 2.0 | +0.5 multiplexing, +1.0 complex state |
| File upload na BE | presigned URL nebo multipart, progress | 1.0 | +0.5 resumable upload |
| Mapování datových typů BE→FE | Zod schemas / typy | 0.5 | per doménový objekt |
| Third-party API (Stripe, Google Maps, …) | SDK integrace, error handling | 1.5 | dle komplexnosti SDK |
| Webhook zpracování (FE polling) | polling fallback, stale-while-revalidate | 1.0 | |

## DevOps a architektura (DEV)

| DEV | Popis | MD |
|-----|-------|----|
| GitHub Actions — CI (typecheck + lint + build) | základní pipeline | 1.0 |
| GitHub Actions — CI + testy | přidá Vitest run | 1.5 |
| GitHub Actions — CI + E2E | přidá Playwright | 2.0 |
| GitLab CI varianta | ekvivalent GitHub Actions | 1.5 |
| Preview deploys (Vercel / Netlify per PR) | automatické preview URL | 1.0 |
| Docker build + push do registry | Dockerfile, multi-stage, .dockerignore | 1.0 |
| Nginx konfigurace (SPA fallback) | konfig, cache headers, gzip | 0.5 |
| Env management (dev/staging/prod secrets) | .env.* structure, dokumentace | 0.5 |
| Sentry FE setup | DSN, source maps, breadcrumbs | 0.5 |
| Lighthouse CI gate | automatický audit v CI, budget | 0.5 |
| Dependabot / Renovate setup | auto-update PRs | 0.5 |
| Release workflow (Changesets / semantic-release) | automated versioning | 1.0 |

## Bugfix / UAT rezerva (UAT)

```
UAT rezerva = CEIL( (Σ SCR + Σ FR + Σ INT) × 0.15 , 0.5 )
Buffer neznámé = CEIL( celkový součet × 0.10 , 0.5 )
```

Zaokrouhlit nahoru na nejbližší 0.5 MD.

## Nefunkční požadavky (NFR)

| NFR | Popis | MD | Trigger |
|-----|-------|----|---------|
| WCAG 2.1 AA audit + opravy | screener + axe-core + ruční | 1.0 | vždy pro veřejný sektor |
| Performance optimalizace | lazy loading, code splitting, bundle analysis | 1.0 | pokud >100 routes nebo heavy deps |
| Core Web Vitals fix | LCP/CLS/FID optimalizace | 1.5 | pokud public SEO pages |
| Security hardening FE | CSP headers, sanitizace, XSS audit | 1.0 | pokud user-generated content |
| Cross-browser testování | BrowserStack / manual | 1.0 | pokud IE/starý Safari nutný |
| Mobile / responzivita dopracování | mobilní-first QA run | 0.5 | per sada obrazovek |

## Confidence škála

| Confidence | Kdy |
|-----------|-----|
| HIGH | Figma finální, API spec dostupná, jasné user flows |
| MEDIUM | Figma draft nebo chybí, API spec TBD |
| LOW | Pouze verbální popis, žádné podklady, mnoho PENDING_CLIENT |
