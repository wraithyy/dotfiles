# Performance: Model Routing (Claude 5 era)

Session default is `opusplan` (settings.json): Opus 5 in plan mode, Sonnet 5
for execution. Cost order per MTok:
Fable $10/$50 > Opus 5 $5/$25 > Sonnet 5 $3/$15 > Haiku 4.5 $1/$5.
Sonnet 5 is near-Opus on coding/agentic work — subagent default, not a
compromise.

| Tier | Model | Use |
|---|---|---|
| Main session | opusplan (or opus) | daily work: planning on Opus, execution on Sonnet |
| Exceptional | fable (`/model fable`) | only hardest long-horizon/complex tasks; switch back after |
| Subagent default | sonnet | implementation, review, tests, research digests — most workers |
| Subagent escalation | opus | only after sonnet failed that specific task, or architecture-grade reasoning |
| Trivial mechanical | haiku | formatting, single-file greps, doc lookups, checklist runs |

Rules of thumb:

- Don't pass `model:` overrides per task; agent frontmatter already pins tiers.
- Prefer lowering `effort` over downgrading model for cheap mechanical work
  (agent frontmatter supports `effort: low|medium|high|xhigh`; session default
  is xhigh).
- Fable: exceptional use only — weekly usage caps (50% of plan limits), 2x
  Opus price; never as subagent model.

Gotchas:

- Fable sessions can silently fall back to Opus via safety classifier and STAY
  there — after `/model fable`, verify the active model mid-session.
- Mid-session model switches re-read full history uncached (one-time token
  cost) — switch at plan boundaries, not mid-task.
- `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is SET in settings env (2026-08-03):
  built-in agents (general-purpose, Explore, Plan) otherwise inherit the
  session model — 1,530 Fable subagent msgs leaked that way in 30d. It
  outranks frontmatter pins too (explorer's haiku, deliberate opus
  escalations); for an intentional opus/haiku subagent, unset it for that
  session or pass model in the Agent call.

## Context window

Avoid last 20% of context for: large refactors, multi-file features, complex
debugging. Low-sensitivity: single-file edits, utilities, docs, simple fixes.
