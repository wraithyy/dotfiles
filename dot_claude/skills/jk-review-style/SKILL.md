---
name: jk-review-style
description: Code review in Josef Kvapil's style for React/MUI/TanStack/Hono/Drizzle frontends, plus general React correctness. Use when reviewing a PR/MR/diff, when the user asks for "review like me", "my review style", "JK review", or when self-reviewing FE code before commit. Encodes recurring concerns: rem over magic px, theme/sx over hardcoded values, component & hook extraction, named exports, i18n all strings, functional/immutable style, React 19 context API, Hono InferResponseType over casts, TanStack Query invalidation after mutations, key-remount over useEffect state resets. Also enforces general React best practice: "You Might Not Need an Effect" (react.dev), Rules of Hooks, stable list keys, no state mutation, cleanup, controlled inputs, a11y basics.
---

# JK Review Style

Review frontend code the way Josef (jkvapil) does. Derived from ~60 real review comments across 13 merged MRs on a React + MUI + TanStack Router/Query + Hono + Drizzle stack.

## Tone & format

- **Direct, concise, friendly.** Short comments. Czech is fine. Emoji `:)` / `:D` to soften nits and to praise (`pěkný`, `gj`, `vypadá to dobře`). Praise good code explicitly — don't only flag problems.
- **Explain the "why", and link docs.** Reasons given, not just rules ("kvůli serverside renderu a memoizaci", "porovnává referenci"). Drop a real doc URL when relevant (react.dev, tanstack.com, dev.to articles).
- **Offer the concrete fix.** Suggest the exact rename, the `suggestion` block, the alternative API. Don't just say "this is wrong".
- **Calibrate severity.** Most comments are nits ("jen drobnosti, pěkný"). Distinguish "blocker" from "nice to have". Pragmatic about merging WIP: sometimes "zatím to neřeš ale myslet na to" / "domergujeme main a tam to bude" — ship and iterate, but name the debt.

## What to flag (in rough priority order)

### 1. Styling: no magic numbers, no hardcoded values
- **Magic pixel numbers → `rem`.** "podezřele divný magický číslo... vzal bych to přes rem". Every pixel ideally rem. Split shorthand into axes: `py`/`px` instead of one blob.
- **Colors from `theme.palette`,** never hardcoded hex. "barvy z theme".
- **Inline style logic → pull into `sx`** as a callback `(theme) => ...`, or extract a function. Don't compute style values in component body when `sx` can do it. "není potřeba.. když potřebujeme vytáhneme jako callback z sx".
- **No `float` with fl. ** "při flexu se float nepoužívá (tak 8 let už), místo toho margin-left: auto".
- `height` that should be `minHeight`. Watch fixed vs sticky headers (sticky often feels janky).

### 2. Component & hook extraction
- **Long files / repeated JSX → extract a component.** Threshold is low: a file >300 lines that isn't even wired to BE yet is too long. "zkus vymyslet jak udělat přepoužitelné komponenty a zkrátit to".
- **Repeated dialog/snippet patterns → one reusable component** (e.g. a `Dialog` that handles `isMobile` itself, so callers don't repeat it).
- **Repeated logic → custom hook.** Pagination logic, `useIsMobile`, etc. "z tý pagination logiky by určitě šel udělat hook pro všechny tabulky".
- **Separate UI concerns from business concerns** when extracting.

### 3. Naming & conventions
- **Booleans start with `is`/`has`.** `tableVisible` → `isBaseListVisible`. Cryptic names that hide intent → rename.
- **Callback props named `onXChange`** (`setSelectedArea` prop → `onSelectedAreaChange`). Event handlers `onCreate`, `onDelete`.
- **Named exports everywhere, consistently.** Flags mixing default + named exports. "zůstal bych u named exportů at to máme všude konzistentní".
- **Component names capitalized** (`car.tsx` component → `Car`).
- **Consistency over preference:** `open` vs `isOpen`, `en` vs `enUS` — pick one and use it everywhere. Inconsistency itself is the bug.
- **Name test/mock data as if real** (`reservations`, not `testData`).

### 4. i18n
- **Every user-facing string goes through locales.** No inline literal text in components. For dates, format via i18next (interpolation with date-fns) rather than hand-rolling.

### 5. Functional / immutable style
- **Avoid `let`** — lean functional. Prefer `const x = cond ? a : b` over reassignment. If a value is truly never read, delete it rather than declaring it.
- **Pure functions:** use the parameter passed in, not an outer-scope variable that happens to have the same value (`carId` arg vs captured `selectedCar.id`).
- **`Set` for uniqueness compares by reference** for objects — `new Set(data.map(i => i.id))`, not `new Set(objects)`. Dedup on a primitive key (id), not the object, and **not on a non-unique field** (SPZ/plate isn't unique → use id).
- Wrap derived data in `useMemo` where it matters.
- **Remove dead code & leftover comments.** Unused declarations, scaffolding comments, types that duplicate an existing definition.

### 6. React patterns
- **Reset state via `key` remount, not `useEffect`.** "kdyby si dala `key={selected.id}` tak nemusíš řešit useEffecty na vynulovávání states — když se mění key, remountne se komponenta a reinicializují stavy". Conversely, flag dialogs that DON'T reset state on open/close — data leaks between opens.
- **No `state` + `useEffect` mirror of a derived value.** If a hook already returns it (e.g. `useMediaQuery`), just return that — drop the state and effect. Use `useMediaQuery((theme) => theme.breakpoints.down('sm'))`, better than manual listeners (SSR, memoization, readability).
- **React 19:** `use(Context)` instead of `useContext`; `<Context>` without `.Provider`. Link react.dev.
- **`setX(prev => !prev)`** not `setX(!x)` — stale closure risk.

### 7. Data layer: TanStack Query + Hono
- **After any mutation → `queryClient.invalidateQueries`** so dependent queries refetch and the UI stays coherent. Link the TanStack invalidation guide.
- **`useMutation` must have `onError`** so a thrown error doesn't crash the app — at minimum `console.error`, ideally a notification. Also check `res.ok` and throw on failure.
- **Type Hono responses with `InferResponseType<typeof api.x.$get, 200>`** instead of casting (`as`). Prefer typing the queryOptions generic / the queryFn return over casting a value — faster and type-safe. (Aligns with the global "avoid type casts" rule.)

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
- **Accessibility basics:** interactive elements are real buttons/links (not `onClick` on a `div`), inputs have labels, images have `alt`.
- **Error/loading states:** query/mutation hooks handle `isError`/`isLoading`; don't render against possibly-undefined data.
- **Keys of correctness over style:** when something is both a JK-style nit and an actual bug (stale closure, missing dep, key on index), rank it as a 🔴/🟡 bug, not a 🟢 nit.

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

1. Skim the diff for **scope/size** first — flag oversized files/components before nitpicking lines.
2. Go line-by-line for the categories above. Emit each finding in the output format above, anchored to file:line.
3. Group trivia: when the same nit repeats (rem, theme), call it once and say "won't repeat it everywhere" rather than spamming.
4. **End with a verdict + an encouraging summary line.** e.g. "Jen drobnosti, jinak hezký :) gj" / "Vypadá dobře, GJ" / list of blocking items if any.
5. Separate **style/structure review** from **functional review** (does it actually work, does it jump/glitch in the UI) — Josef often splits these into two passes.

## Quick checklist to paste into a review

- [ ] No magic px (rem), no hardcoded colors (theme), style logic in sx
- [ ] Files/components not too long; repetition extracted to component/hook
- [ ] Booleans `is*`, callbacks `on*Change`, named exports, consistent naming
- [ ] All strings in locales
- [ ] No `let`/mutation; pure functions; Set dedup on unique primitive
- [ ] State reset via `key`; no useEffect mirroring derived values; React 19 context API
- [ ] invalidateQueries after mutation; useMutation onError; res.ok checked
- [ ] Hono InferResponseType, no `as` casts
- [ ] Route-active via useMatch/activeProps, not pathname compare
- [ ] Praise what's good; verdict line at the end
