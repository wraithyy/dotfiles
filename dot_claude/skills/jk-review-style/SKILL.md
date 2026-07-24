---
name: jk-review-style
description: Code review in Josef Kvapil's style for React/MUI/TanStack Router+Query/orval frontends, plus general React correctness. Use when reviewing a PR/MR/diff, when the user asks for "review like me", "my review style", "JK review", or when self-reviewing FE code before commit. His #1 concern is component size (≤300-350 lines, split into smaller components for perf). Also: forms on the project's typed form lib + Zod (TanStack Form / RHF), rem for spacing (px OK for fontSize), theme/styled over hardcoded values, no `as` casts (discriminated unions, orval-generated types), named exports, i18n all strings even Czech-only, functional/immutable style, React 19 context API, TanStack Query invalidation after mutations, key-remount over useEffect state resets. Also enforces general React best practice: "You Might Not Need an Effect" (react.dev), Rules of Hooks, stable list keys, no state mutation, cleanup, controlled inputs, a11y basics, plus E2E/CI (test-id selectors, assert presence not text).
---

# JK Review Style

Review frontend code the way Josef (jkvapil) does. Derived from his real review comments on **sos-fe** (SOS-01/02) and **bouracka-fe**. Stack: React 19 + MUI + TanStack Router/Query + **orval** (codegen API client) + Zod. Forms lib is per-project: TanStack Form (sos-fe) / react-hook-form (bouracka-fe). No Hono, no Drizzle on the FE.

## Tone & format

- **Direct, concise, friendly.** Short comments. Czech is fine. Emoji `:)` / `:D` to soften nits and to praise (`pěkný`, `gj`, `vypadá to dobře`). Praise good code explicitly — don't only flag problems.
- **Explain the "why", and link docs.** Reasons given, not just rules ("kvůli serverside renderu a memoizaci", "porovnává referenci"). Drop a real doc URL when relevant (react.dev, tanstack.com, dev.to articles).
- **Offer the concrete fix.** Suggest the exact rename, the `suggestion` block, the alternative API. Don't just say "this is wrong".
- **Calibrate severity.** Most comments are nits ("jen drobnosti, pěkný"). Distinguish "blocker" from "nice to have". Pragmatic about merging WIP: sometimes "zatím to neřeš ale myslet na to" / "domergujeme main a tam to bude" — ship and iterate, but name the debt.

## What to flag (in rough priority order)

### 1. Styling: no magic numbers, no hardcoded values
- **Spacing (padding/gap/margin) in px → `rem` or `theme.spacing()`.** "paddingy/gapy v px stringách... radši přes rem nebo `theme.spacing()`, ať layout přežije zoom fontu." Split shorthand into axes: `py`/`px` instead of one blob.
- **`fontSize` in px is OK — do NOT force rem there.** Important nuance: "remy jsou super, ale když by to mělo být za cenu toho že se to zvláštně počítá z velikosti písma v html aby to sedělo na pixely, tak radši px; naopak na padding je rem fajn, protože při zvětšování fontu se nerozsypává layout." So: rem for spacing (survives zoom), px fine for fontSize.
- **Colors from `theme.palette`,** never hardcoded hex/rgba. Single source of truth: "je jen jeden zdroj pravdy a není to roztahaný všude po kodu"; "když si UX rozmyslí že chce změnit barvičky, je to pak na jednom místě". When transparency is needed, `alpha(theme.palette.primary.main, 0.35)` in sx, not a hardcoded `rgba(...)`. Common paddings/spacings belong in theme too.
- **Prefer a MUI `styled` component over inline `sx`** — his preferred fix. "zkus udělat styled component :) je to zajímavější a takový standard pattern u MUI" (https://mui.com/system/styled/). Inline style objects lose type hints AND the theme callback: "tady ztrácíš typovou nápovědu a nemůžeš používat ani theme callback." Theming the MUI components kills most inline sx. When you do keep `sx`, style logic goes in a `(theme) => ...` callback, never computed in the component body.
- **No `float` with flex.** "při flexu se float nepoužívá (tak 8 let už), místo toho margin-left: auto".
- `height` that should be `minHeight`. Watch fixed vs sticky headers (sticky often feels janky).

### 2. Component & hook extraction — HIS #1 MOST FREQUENT POINT
- **300–350 line ceiling per component → split.** The single thing he raises most (≈9× across MRs). "když už má komponenta 300 řádků tak to začíná být horní hranice a je čas přemýšlet jak to rozsekávat"; "fakt ideálně max 300-350 řádků na komponentu". **Page/route components may be larger** — up to ~500. The client's *second vendor* also pushed for this, so it's not just JK's preference. Report actual line counts of oversized files up front.
- **Split reasoning is performance, not just tidiness.** Always give it: "menší komponenty nejenom dělají přehlednější kod, ale zlepšují performance, protože zmenšujou DOM který se musí kvůli změně statu rerendrovat."
- **Comments in the code mark the split points.** A `// --- section ---` banner = extract that section into its own component.
- **Every dialog is its own component**, and things it maps inside get split too. A row can be a component.
- **Where to put it:** atomic bits used only here live in the feature folder (`tenders/`); promote to shared only once reused.
- **Colocate a page into its route file once ~500 lines** (for loaders/query params).
- **Table internals → hooks & cell components** (`useParticipantsColumns`, `SupplierOfferRow`, `PriceCell`/`StatusCell`). Helpers extracted but still in one file = only "dobrej začátek" — finish into separate files.
- **Repeated logic → custom hook.** Pagination, `useIsMobile`, permissions, etc.
- **Repeated dialog/snippet patterns → one reusable component** (e.g. a `Dialog` that handles `isMobile` itself).
- **Separate UI concerns from business concerns** when extracting.

### 2b. Forms → typed form lib + Zod (strong, recurring) — pick the PROJECT's lib
> **Stack calibration:** meta-rule is "no hand-rolled form state — use the project's typed-form-lib + Zod, schema in its own file." **sos-fe uses TanStack Form**, **bouracka-fe uses react-hook-form**. Match what the project uses.
- **Hand-rolled form state (many `useState` + manual validation) must be rewritten.** "už je fakt potřeba použít tanstack form + zod... ušetří to desítky řádků... takhle to určitě zůstat nemůže." A big form hook is "hrozně špatně udržovatelný" + "obrovský prostor pro chybu."
- **It replaces validation, `isDirty`, `isSaved` states.** Zod schema in its own file (`createTenderForm.schema.ts`). If not now, leave a `TODO` and name the debt.
- **Praise it when present:** "ha supr, chválím tanstack form :)". Never copy a store into local state for a form (two sources of truth).

### 3. Naming & conventions
- **Booleans start with `is`/`has`.** `tableVisible` → `isBaseListVisible`. Cryptic names that hide intent → rename.
- **Callback props named `onXChange`** (`setSelectedArea` prop → `onSelectedAreaChange`). Event handlers `onCreate`, `onDelete`.
- **Named exports everywhere, consistently.** Flags mixing default + named exports. "zůstal bych u named exportů at to máme všude konzistentní".
- **Component names capitalized** (`car.tsx` component → `Car`).
- **Consistency over preference:** `open` vs `isOpen`, `en` vs `enUS` — pick one and use it everywhere. Inconsistency itself is the bug.
- **Name test/mock data as if real** (`reservations`, not `testData`).
- **Code is English.** Translate incoming Czech domain terms; keep a comment with the original on the initial translation. "anglicky pls :) ... klidně komentář do initial přeložení aby se vědělo."
- **Roles/permissions → `as const` map or a `usePermissions` hook returning `is*` booleans** (`isDodavatel`, `isZakaznik`), not raw string compares scattered around.
- **YAGNI on props/vars** — don't declare until needed. "klidně tam ty proměnný zatím nemusíš mít a vemeš je až budou potřeba :)."

### 4. i18n
- **Every user-facing string goes through locales — even in a Czech-only app.** "je dobrý používat i18next i za předpokladu že budeme mít jenom češtinu... zákazník má radost že dostane jeden soubor." Flag literals in JSX (`# Číslo řízení` → `tenders.card.tenderNumber`) and MUI props that slip through (`labelRowsPerPage`, `labelDisplayedRows` → `common.pagination.*` with interpolation).
- For dates, format via i18next (interpolation with date-fns) rather than hand-rolling.

### 5. Functional / immutable style
- **Avoid `let`** — lean functional. Prefer `const x = cond ? a : b` over reassignment. If a value is truly never read, delete it rather than declaring it.
- **Pure functions:** use the parameter passed in, not an outer-scope variable that happens to have the same value (`carId` arg vs captured `selectedCar.id`).
- **`Set` for uniqueness compares by reference** for objects — `new Set(data.map(i => i.id))`, not `new Set(objects)`. Dedup on a primitive key (id), not the object, and **not on a non-unique field** (SPZ/plate isn't unique → use id).
- **Wrap per-render recomputation in `useMemo`.** A `flatMap`/derive over static data that reruns on every keystroke of a form → `useMemo(..., [])`.
- **No underscore-prefixed dead code.** `_getFoo`, `void unusedVar` — delete it, git remembers. "Podtržítko = vím že to nepoužívám ale nechávám si to — to nechceme." Solve lint-unused by dropping from destructuring, not `void`.
- **Remove dead code & leftover comments.** Unused declarations, scaffolding comments, types that duplicate an existing definition.
- **Mock-data mutation must be marked `// TODO(API)`** so it doesn't leak into the store / real data.
- **No nested ternary → extract a function.** SonarQube complains (S3358) and it reads badly.
- **Inline handlers → named function handler.** "takhle inline se to hrozně blbě čte." (Short one-liners are fine.)

### 6. React patterns
- **Reset state via `key` remount, not `useEffect`.** "kdyby si dala `key={selected.id}` tak nemusíš řešit useEffecty na vynulovávání states — když se mění key, remountne se komponenta a reinicializují stavy". Conversely, flag dialogs that DON'T reset state on open/close — data leaks between opens.
- **No `state` + `useEffect` mirror of a derived value.** If a hook already returns it (e.g. `useMediaQuery`), just return that — drop the state and effect. Use `useMediaQuery((theme) => theme.breakpoints.down('sm'))`, better than manual listeners (SSR, memoization, readability).
- **React 19:** `use(Context)` instead of `useContext`; `<Context>` without `.Provider`. Link react.dev.
- **`setX(prev => !prev)`** not `setX(!x)` — stale closure risk.
- **The `setState` updater must be PURE — no side effects.** Calling `navigate`/`logout`/a mutation inside `setX(prev => ...)` is a bug: React may invoke it twice (StrictMode) → double action. Keep the updater to computing the next value; put the side effect in an effect watching the resulting state.
- **"Dumb" UI components don't self-normalize via effects.** Normalize where the value is loaded (e.g. `normalizeDate` at draft load), not with a silent side-effect in the UI component that calls the parent `onChange` (render-loop risk).

### 7. Data layer: TanStack Query + orval (codegen)
> **Both sos-fe and bouracka-fe use orval (codegen from an OpenAPI/swagger spec) + TanStack Query.** The generated typed client/hooks ARE the source of truth — so a manual `as` cast over a codegen'd response, or hand-writing a fetch/type orval already generates, is the smell to flag. (An older assumption of Hono RPC + `InferResponseType` is NOT the stack — ignore Hono-specific advice.)
- **After any mutation → `queryClient.invalidateQueries`** so dependent queries refetch and the UI stays coherent. Link the TanStack invalidation guide.
- **`useMutation` must have `onError`** so a thrown error doesn't crash the app — at minimum `console.error`, ideally a notification. Also check `res.ok` and throw on failure.
- **Any `as` cast is a smell → fix the types.** "když se musí dělat typecast `as boolean`, tak je budto zbytečný, nebo se to dá vyřešit lepším typováním." Reach for a **discriminated union** (`{ field: 'selected'; value: boolean } | { field: 'priceInput'; value: string }`) so the value type is inferred. **`as never` silencing typed i18n keys is dangerous** — i18next then silently returns the key string; type error codes as a union of keys instead.

### 8. Routing (TanStack Router)
- **Don't detect the active route by manual `pathname === "/x"` string compare** — it bypasses the router and breaks against the real route tree (`/_authed/dashboard`). Use `useMatch` or `activeProps` on `<Link>`.

### 9. You Might Not Need an Effect (react.dev)

Read https://react.dev/learn/you-might-not-need-an-effect — most `useEffect` in a PR is a smell. Flag these patterns and give the listed fix:

- **Transforming data for render → compute during render.** Don't store derived data in state + sync it in an effect. `const fullName = firstName + ' ' + lastName;` (memoize only if expensive). If an effect's only job is "when X changes, setY(f(X))", delete it.
- **Filtering/sorting a list in an effect → do it inline** (wrap in `useMemo` if the list is large).
- **Resetting state when a prop changes → use `key`,** not an effect (matches the JK key-remount rule above). Reset *part* of state by lifting it + a `key` on the child.
- **Adjusting state when a prop changes → compute it during render** or recompute everything; avoid the effect that patches one field.
- **Handling a user event → put the logic in the event handler,** not in an effect that watches the resulting state. Effects are for *synchronizing with external systems*, event-specific logic is not "because of rendering".
- **Chains of effects each setting state that triggers the next** → collapse into one handler / compute in render. Cascading `setState`-in-effect is a re-render storm.
- **Sending POST/analytics:** mutations triggered by an interaction belong in the handler; only fire-on-mount (e.g. page-view log) belongs in an effect.
- **Subscribing to an external store → `useSyncExternalStore`,** not a manual effect+listener.
- **Fetching data:** prefer the framework's loader / TanStack Query over a raw `useEffect` fetch; raw fetch effects leak race conditions (no cleanup/ignore flag).

When you keep an effect, check it has: correct dependency array (no lies, no missing deps), a **cleanup** function where it subscribes/sets timers, and that it genuinely syncs with something *outside* React.

### 10. General React correctness (beyond JK's pet peeves)

Apply standard React best practice even where Josef never commented on it:

- **Rules of Hooks:** no hooks in conditionals/loops/after early return; only call from components or custom hooks.
- **Stable, real keys in lists** — never the array `index` when items reorder/insert/delete; key on a stable id.
- **No `setState` during render** (only the conditional "adjust state during render" exception with a guard). No reading/writing refs during render.
- **Don't mutate state or props** — new objects/arrays (aligns with the global immutability rule). `arr.push`/`obj.x =` on state is a bug.
- **Effects/handlers cleanup:** clear intervals, timeouts, subscriptions, AbortController; abort in-flight fetches.
- **Don't over-memoize:** `useMemo`/`useCallback`/`React.memo` only with a real reason (expensive calc, referential stability for a memoized child / effect dep). Empty-value memoization is noise.
- **Controlled vs uncontrolled:** an input shouldn't flip between the two (`value={x ?? ""}`, not `value={x}` where x can be undefined).
- **Accessibility basics:** interactive elements are real buttons/links, not `onClick` on a `div`/`Box`/`span`. A clickable `Box` is unreachable by keyboard (no `tabIndex`, Enter/Space, focus ring) → use `Button variant="text"` or `IconButton size="small" aria-label={…}`, "to řeší zadarmo." Don't hand-roll tabIndex. Icon buttons need `aria-label` (not just `title`), inputs have labels, images have `alt`.
- **Error/loading states:** query/mutation hooks handle `isError`/`isLoading`; don't render against possibly-undefined data.
- **Keys of correctness over style:** when something is both a JK-style nit and an actual bug (stale closure, missing dep, key on index), rank it as a 🔴/🟡 bug, not a 🟢 nit.

### 11. Repo & tooling hygiene (mention when the diff touches config)
- **Biome is the single formatter — rip ESLint + Prettier (and eslint plugins) out entirely.** Suggests **`ultracite`** (biome config that also wires lefthook pre-commit formatting + strict AI-legible rules).
- **lefthook pre-commit auto-format.** Watch cmd.exe command-length limits in hooks (Windows).
- **Delete generated/duplicate config.** `vite.config.js` when `.ts` exists; `*.tsbuildinfo` (`git rm --cached`).
- **Prefer `pnpm` over `npm`** (faster on Windows). **Push `CLAUDE.md` to the repo** — "už je to standard."

### 12. E2E / Playwright & CI
- **Assert presence, not exact copy.** Product text changes; don't pin a test to a literal string. "nechci kontrolovat že tam je přímo tahle textace... jen bych zkontroloval že se to tam objeví."
- **Prefer `test-id` selectors over text/DOM locators.** "nešlo by tohle udělat spíš přes test-id?"
- **No unrequested scheduled/nightly CI jobs.** YAGNI for infra: disqualifier is "nikdo to po nás nechtěl."

## Output format (REQUIRED)

Produce the review as a list of **inline comments**, mirroring how a GitLab inline comment looks. Each finding is one block with exactly three parts, in this order:

1. **Location** — `path/to/File.tsx:LINE` (or `:START-END` for a range).
2. **Code** — a fenced code block with the actual offending snippet from the diff (the `+` side). Keep it short, just the relevant lines.
3. **Comment** — the review note written in first person AS Josef would type it: short, Czech, friendly, with the "why" and a concrete fix/`suggestion` when applicable. No "the author should…" third-person phrasing — write it directly to the person ("udělal bych…", "tady pozor…", "přejmenuj na…").

**Structure the whole review in 3 layers, top → bottom:**

**Layer 1 — Summary table** (always first). A scan-in-5-seconds overview, one row per finding, sorted blocker → nit:

````md
| # | Sev | Místo | Co |
|---|-----|-------|-----|
| 1 | 🔴 | `Foo.tsx:42` | console.log v onError |
| 2 | 🔴 | `Bar.tsx:88` | Select label nesedí s InputLabel |
| 3 | 🟡 | `baz.tsx:30` | `let answer` → return rovnou |
| 4 | 🟢 | `Chip.tsx:9` | `getStateColor` ven z komponenty |
````

**Layer 2 — Detail per finding.** Each numbered to match the table, three parts: location → code → comment, and **closed with a horizontal rule (`---`)**.

The heading MUST carry the line number(s) — `File.tsx:LINE` or `File.tsx:START-END`. Always include the actual line numbers from the diff; never write just the filename.

````md
### 1. 🔴 `apps/web/src/dialogs/Foo.tsx:42`
```tsx
console.log(error);
```
console.log do mainu nepatří — dej tam aspoň console.error, ideálně notifikaci :)

---
````

**Layer 3 — Verdikt** (always last): one encouraging summary line + any general/non-line comments (UI jank, scope).

Rules:
- Number findings; the same number ties the table row to its detail block. Sort by severity (🔴 → 🟡 → 🟢) in both.
- **Every detail block ends with `---`.** One per finding, so each stands clearly on its own.
- **Heading always has line numbers.** If a finding spans several lines use a range (`:30-34`); if it's one line use that line. The table's "Místo" column carries the same `File:LINE`.
- A standalone praise comment (no fix) skips the code block: just heading + the comment (`pěkný :)`), still closed with `---`.
- Keep code snippets to the few relevant lines, not whole functions.
- If there are very few findings (≤2), skip the table — just the detail blocks + verdict.

## Review workflow

1. Skim the diff for **scope/size** first — flag oversized files/components before nitpicking lines. Report actual line counts of the biggest files up front.
2. Go line-by-line for the categories above. Emit each finding in the output format above, anchored to file:line.
3. Group trivia: when the same nit repeats (rem, theme), call it once and say "won't repeat it everywhere" rather than spamming.
4. **End with a verdict + an encouraging summary line.** e.g. "Jen drobnosti, jinak hezký :) gj" / "Vypadá dobře, GJ" / list of blocking items if any.
5. Separate **style/structure review** from **functional review** (does it actually work, does it jump/glitch in the UI) — Josef often splits these into two passes.

## Standard process for EVERY review (how we do it, always)

Run this end-to-end flow every time:

1. **Pull the MR** (GitLab MCP): diff_refs (base/head/start sha), diff, file line counts. Prefer local checkout + `git diff origin/main...HEAD` for big diffs; keep raw output in a subagent/sandbox, not main context.
2. **Cross-reference PREVIOUS MRs first.** Pull earlier MR discussions and check whether Josef already raised it. Mark each finding **REPEAT** (reference it, don't re-nag — "navážu na SOS-01…"), **FOLLOW-UP**, or **NEW**. Carry-over debt the author deferred is acknowledged, not re-litigated.
3. **Run a SonarQube pass** (its own lens): cognitive complexity (S3776 — flagship for oversized components), nested ternary (S3358), duplicated literal 3+ (S1192), long fn / too many params, TODO without ticket (S1135). Frame as "sonar tady neprojde, protože…". SonarLint/SonarQube is being adopted on the projects. Prefer the root fix (split the file) over per-symptom tweaks.
4. **Go finding-by-finding with the author before posting.** Present each with the EXACT comment text visible, and let them keep / skip / rewrite in their own words. Respect their wording verbatim. Don't dump all comments unilaterally.
5. **Deliver as GitLab draft notes** (`create_draft_note`, unpublished) so the author reviews the batch and publishes/edits/deletes themselves — never auto-publish unless told. Inline (`position_type: 'text'`, `new_line`) only on lines actually in a diff hunk; use `position_type: 'file'` for whole-file/size comments, new files, or findings on unchanged code. Verdict is a general note (no position).
6. **Prefer fewer, self-documenting fixes over more comments.** Say the big ask once at MR level; ideally the code needs fewer comments because it's self-explanatory.

## Quick checklist to paste into a review

- [ ] **Component ≤300–350 lines** (pages ≤~500); split at comment markers → smaller components (perf). Report LOC of oversized files first.
- [ ] **Forms on the project's typed form lib + Zod** (TanStack Form on sos-fe / RHF on bouracka), schema in own file — no hand-rolled useState forms
- [ ] rem for spacing (px OK for fontSize); colors + paddings from theme (single source), `alpha()` for transparency; prefer `styled` over inline sx
- [ ] Repetition extracted to component/hook; every dialog its own component
- [ ] Booleans `is*`, callbacks `on*Change`, named exports, consistent naming; English code; roles via usePermissions/`as const`
- [ ] All strings in locales (even Czech-only); MUI props too
- [ ] No `let`/mutation; pure functions; Set dedup on unique primitive; useMemo per-render recompute
- [ ] No `_`-prefixed dead code; mock mutation `// TODO(API)`; no nested ternary; inline handler → named fn
- [ ] State reset via `key`; no useEffect mirroring derived values; setState updater pure; React 19 context API
- [ ] invalidateQueries after mutation; useMutation onError; res.ok checked
- [ ] No `as` casts → discriminated union / orval-generated types (don't hand-type responses)
- [ ] Route-active via useMatch/activeProps, not pathname compare
- [ ] a11y: real Button/IconButton + aria-label, not onClick on div/Box
- [ ] E2E: assert presence not exact text, test-id selectors; no unrequested CI jobs
- [ ] Praise what's good; verdict line at the end
