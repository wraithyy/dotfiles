# Claude Code Global Rules

## Subagents

Delegate by naming the agent when the task fits one: verbose/disposable
output, tool-restricted work, review/verification (code-reviewer;
security-reviewer for auth/payment code). Iterative shared-context work
belongs in the main session.

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
