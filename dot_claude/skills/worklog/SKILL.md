---
name: worklog
description: Reconstruct what the user actually worked on over a period (today, the past week, the past month, or a custom date range) from git history, the Notes vault meeting notes, and Claude Code session transcripts, then publish it as an interactive filterable table artifact with "reported to timesheet" checkboxes. Use when the user asks "what did I do this week/today/this month", wants a recap for vykazování/timesheet, or invokes /worklog.
---

# Worklog

Produces the same artifact built in the 2026-08-07 chezmoi session: a table
grouped by day, with filter chips (day/project/type), a search box, and
per-row checkboxes that persist to `localStorage` so the user can tick off
what they already reported to their timesheet. Reuses `template.html`
bundled next to this file — do not redesign it from scratch each run, fill
its placeholders.

## Step 0 — resolve the range

Parse the argument the user gave (`args` after `/worklog`, or their plain-language
ask):

| Argument | Range |
|---|---|
| `today` / no argument / "co jsem dělal dnes" | today only |
| `week` / "tento týden" / "uplynulý týden" | Monday of the current week through today (if asked mid-week) — confirm with the user whether they mean the current in-progress week or the last full Mon–Sun week; default to current week to date |
| `month` / "tento měsíc" / "uplynulý měsíc" | 1st of the current month through today, unless they clearly mean the previous calendar month |
| `YYYY-MM-DD..YYYY-MM-DD` / two dates in prose | that literal range, inclusive |

Get today's date from the environment context (the session's `currentDate`), never
compute it — `Date.now()`/shell `date` inside a workflow script is unreliable, and
guessing is worse. Once resolved, run one `date` shell command to print the
Monday of that week etc. if the arithmetic isn't obvious — don't hand-calculate
weekday math.

State the resolved range back to the user in one line before gathering data
(catches "oh I meant last week" early).

## Step 1 — gather raw sources (parallel, in one message)

Three independent sweeps, same as before:

1. **Git log** across every repo under the user's dev roots (ask once if unknown;
   typically `~/Development/**` two levels deep plus the chezmoi/dotfiles repo)
   for the resolved range:
   ```
   git log --since="<start>" --until="<end+1day>" --date=short --pretty=format:'%ad %h %s'
   ```
   Search at least two directory levels deep — client repos often live nested
   (`~/Development/<org>/<project>`, `~/Development/<org>/<project>/<subpackage>`).
   A one-level glob misses them (this bit the first run on this exact skill).

2. **Notes vault meeting notes** — if the user has one (check for a vault
   `CLAUDE.md` describing structure, e.g. `~/Development/Notes`), find files
   under the meetings folder modified/dated within range, and read each one's
   frontmatter `summary` field plus the "Poznámky" / "Úkoly na mě" sections.

3. **Claude Code session transcripts** — `~/.claude/projects/*/*.jsonl`
   (top-level files only, skip `subagents/` — those are noise), filtered to the
   range with `find <dir> -maxdepth 2 -iname "*.jsonl" -newermt "<start>" ! -newermt "<end+1day>"`.
   This is the step people forget: git commits and meeting notes miss all the
   review/debug/analysis work that never became a commit in the user's own repo
   (reviewing someone else's MR, an architecture discussion, a bug diagnosed but
   fixed by someone else). Group the matched files by project directory.

## Step 2 — digest sessions without blowing up context

Session JSONL files are large and mostly tool-call noise. Never `Read` them
directly into the main context. Spawn one `explorer`-type `Agent` per project
group (parallel, single message, multiple tool calls) with a prompt like:

> Read these Claude Code session transcript files (JSONL, one JSON object per
> line, `timestamp`, `type: "user"/"assistant"`, message in `.message.content`):
> `<paths>`
> Project: `<name>`, range: `<start>`–`<end>`.
> For each file: get the first timestamp, look at the first 2-3 user messages
> for the task, skim the last assistant messages for the outcome. Ignore tool
> noise, system-reminders, and any persona/mode chatter (caveman, ponytail, etc).
> Output a compact chronological list of concrete work done — bugs fixed,
> features, file names if clear. Terse bullets, skip empty/trivial sessions.

One agent per project keeps each call's output small and lets them run
concurrently. Don't spawn one agent per file — that's too fine-grained and
loses cross-session context within a project.

## Step 3 — build the entries

Merge git commits, meeting notes, and session digests into one flat list of
"entries" — one per unit of work, not one per commit (squash a commit batch
against the same feature into one entry, same as the git log showed 8 NFC
fix commits as one row, not eight).

Bucket every distinct project into at most 6 category slots (`catA`..`catF` —
the template only ships 6 hues). If more than 6 distinct projects appear,
group the least active ones under a shared "ostatní nástroje" or similar
bucket rather than adding a 7th color. Client/paid work and personal tooling
should usually end up in visually distinct slots.

Pick a small, closed vocabulary for `type` (4-6 values covers almost every
week: `schuzka`, `review`, `vyvoj`, `analyza`, `dokumentace` worked well —
don't invent a new type per entry).

## Step 4 — fill the template and publish

1. Load the `artifact-design` skill (required before any Artifact publish) —
   for this report the treatment is a UI/dashboard, not editorial; the bundled
   `template.html` already encodes that decision, so this is mostly a sanity
   check that nothing about *this* run calls for a different treatment.
2. Copy `template.html` (next to this SKILL.md) to a scratch path, then replace
   its placeholders:
   - `__TITLE__` — e.g. "Týden 3.–7. srpna 2026" / "Dnes, 7. srpna 2026"
   - `__PERSON__` — the user's name if known, else omit the eyebrow subtitle
   - `__DAYS__` — ordered `[{key, label, date}]`, one per day that actually has
     entries (`key` = ISO date used to join against entries, `label` = short
     weekday, `date` = display date)
   - `__CATS__` — `{catA: "Client X", catB: "Client Y", ...}`
   - `__TYPES__` — `{schuzka: "schůzka", ...}`
   - `__ENTRIES__` — the array built in Step 3
   - `__TASKS__` — open action items pulled from meeting notes' "Úkoly na mě",
     or `[]` to hide the section
   - `__STORAGE_KEY__` — a string unique to this range, e.g.
     `"vykazovani-2026-08-03..2026-08-07"` (so different runs/ranges don't
     collide in the same browser's localStorage)
   - `__SOURCE_NOTE__` — one sentence naming what was scanned and any known gaps
     (e.g. "commits found with no matching session log")
3. Publish with `Artifact` (`favicon: "📋"`, a one-line `description`). If this
   is a redeploy of a report the user already has open, pass the same
   `file_path` (and `url` if it's from an earlier conversation) to keep the URL
   stable; a genuinely new range mints a new artifact.

## Notes

- The checkbox state lives only in the viewer's browser (`localStorage`),
  never sent anywhere — say so in the source note, same as before.
- Don't fabricate entries to fill gaps. If a source is unavailable (no Notes
  vault, no session logs for a project), say so in the source note rather than
  inventing plausible-sounding work.
- If the resolved range has zero entries from all three sources, say that
  plainly instead of publishing an empty artifact.
