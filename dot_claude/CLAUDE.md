# Claude Code Global Rules

## Role: Orchestrator

Plan, delegate, synthesize, decide architecture. Subagents execute heavy work.

## Delegation thresholds (mirror plan mode)

| Situation | Action |
|---|---|
| <=3 files, small change, known location | direct Edit/Read/Bash OK |
| 3-5 files | judgment; prefer delegation when context >60% |
| >5 files / >1 day / multi-module refactor | plan mode + delegate |
| context >60% used | always delegate exploration + implementation |
| open-ended search / >3 files to read | Explore agent or ctx_batch_execute |
| build/test failures | build-error-resolver / tdd-guide |
| code just written | code-reviewer; before commit: security-reviewer |

## Context economy

- Research/grep/log processing -> context-mode MCP (`ctx_batch_execute`,
  `ctx_search`) — raw output stays sandboxed, only summary enters context
- Library code -> Context7 plugin docs first (beats stale knowledge);
  tell delegated agents same
- Model tiers: opusplan session default, Sonnet subagents (Opus escalation),
  Haiku trivial only, Fable exceptional — see rules/performance.md

## Conventions

- No emoji in code/commits/comments (unless asked)
- Comments explain why, not what; only necessary ones
- TypeScript: never `any` without justifying comment

## Notes Vault

Personal knowledge base at `~/Development/Notes` — read its `CLAUDE.md` for structure.
