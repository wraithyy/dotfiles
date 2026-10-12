# Performance: Model Routing (Claude 5 era)

Session default is `opus` (settings.json model): Opus 5 for planning and
execution; `opusplan` (Sonnet 5 execution) is the cheaper opt-in. Cost order per MTok:
Fable 5.1 $10/$50 > Opus 5 $5/$25 > Sonnet 5 $2/$10 > Haiku 4.5 $1/$5.
Fable 5.1 cache reads are $0.25/MTok (1/4 of Fable 5) — long cached
sessions run ~25% cheaper than on Fable 5.
Sonnet 5 is near-Opus on coding/agentic work — subagent default, not a
compromise.

| Tier | Model | Use |
|---|---|---|
| Main session | opus (or opusplan) | daily work on Opus; opusplan when cost matters |
| Exceptional | fable (`/model fable`) | only hardest long-horizon/complex tasks; switch back after — see stickiness gotcha |
| Subagent default | sonnet | implementation, review, tests, research digests — most workers |
| Subagent escalation | opus | only after sonnet failed that specific task, or architecture-grade reasoning |
| Trivial mechanical | haiku | formatting, single-file greps, doc lookups, checklist runs |

Rules of thumb:

- Don't pass `model:` overrides per task; agent frontmatter already pins tiers.
- Prefer lowering `effort` over downgrading model for cheap mechanical work
  (agent frontmatter supports `effort: low|medium|high|xhigh`; session default
  is `medium` via settings `effortLevel`, below Opus 5's own default of high).
- Fable: exceptional use only — 2x Opus list price ($10/$50 per MTok), never
  as subagent model. Fable 5.1 recalibrated effort levels — medium ≈ Fable 5
  quality at lower cost; re-tune instead of carrying old levels over.

Gotchas:

- `/model X` is sticky: it writes X into user settings, so every later session
  starts on X and live settings.json drifts from chezmoi. Switch back the same
  day as the exceptional task.
- Fable→Opus silent classifier fallback is possible (5.1: fewer classifier
  false positives; measured 4/79 on Fable 5) — check the active model
  mid-session on long Fable runs.
- Mid-session model switches re-read full history uncached (one-time token
  cost) — switch at plan boundaries, not mid-task.
- `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is SET in settings env: built-in agents
  (general-purpose, Explore, Plan) otherwise inherit the session model. It
  outranks frontmatter pins too (explorer's haiku, deliberate opus
  escalations); for an intentional opus/haiku subagent, unset it for that
  session or pass model in the Agent call.

## Context window

Avoid last 20% of context for: large refactors, multi-file features, complex
debugging. Low-sensitivity: single-file edits, utilities, docs, simple fixes.
