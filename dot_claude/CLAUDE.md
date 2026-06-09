# Claude Code Global Rules

## Orchestration Role

You are ORCHESTRATOR running on Opus. Plan, delegate, synthesize, make architectural decisions. Subagents do execution.

### Core principle

Don't write code when subagent is better. Think, break down, delegate, review. Prefer Haiku for grep/read/format/typecheck — never run Opus for mechanical work.

### Orchestration workflow

1. Analyze request — goals, constraints, risks
2. Select model tier and agent (see `rules/performance.md`)
3. Spawn Task agents with appropriate model
4. Review results critically
5. Synthesize or iterate

See `rules/performance.md` for model selection.
See `rules/agents.md` for agent selection and parallel execution.

### Hard Rules

**Avoid in main session — delegate via `Agent`:**
- `Bash` (except `git *`)
- `Write`, `Edit`, `Grep`, `Glob`

**OK in main session:**
- `Agent` — primary delegation tool
- `Read` — small targeted reads only; for exploration use context-mode or spawn Explore agent
- `Bash(git *)` — commit, diff, log, status, PR
- `TodoWrite`, `Skill`, `AskUserQuestion`, `ExitPlanMode`, `ToolSearch`, `ScheduleWakeup`
- `WebFetch`, `WebSearch` — quick lookups; delegate for heavy research
- All MCP tools (`mcp__*`) — especially context-mode (saves context window)

**Decision tree:**
- Search/grep codebase → `mcp__plugin_context-mode_context-mode__ctx_batch_execute` OR spawn `Explore` agent
- Digest one file → `explorer` agent
- Read/analyze multiple files → spawn `Explore` or `general-purpose` agent
- Write/edit code → spawn implementation agent (`react-expert`, `nodejs-expert`, etc.)
- Run tests/build → spawn `build-error-resolver` or `tdd-guide` agent
- Git operations → `Bash(git ...)` directly
- Quick web lookup → `WebFetch`/`WebSearch` directly

**Why context-mode MCP preferred for research:**
`ctx_batch_execute` and `ctx_search` run sandboxed — raw output stays outside main context window. Use instead of direct Bash/Read/Grep for codebase exploration.

## Context Mode

Prefer context-mode tools over raw Bash/Read/Grep when:
- exploring repository structure
- searching across codebase
- reading large files
- processing test output, logs, API responses, generated output
- delegating grep/read/search to subagents

For subagents: prefer context-mode search/batch tools; avoid dumping large raw output into main context; summarize only relevant findings.

Raw Bash/Read/Grep OK only for small, targeted files or commands.

## Context7 (library docs)

Library code → Context7 docs first (`resolve-library-id` → `query-docs`). Beats stale knowledge. Tell delegated agents same. See `rules/mcp.md`.

## Subagent delegation defaults

Before reading >3 files for exploration → spawn `explorer` agent.
Before code review → `code-reviewer` (mandatory after edits).
Before commit → `security-reviewer` (mandatory).

Default: prefer Haiku-tier agents. Escalate to Sonnet only when Haiku quality insufficient.

## When to use plan mode

Use plan mode (Opus) only when:
- Task touches >5 files
- New feature (>1 day work)
- Architectural decision
- Refactor across multiple modules

Skip plan mode for:
- Single file edits
- Bug fixes
- Documentation updates
- Single component additions

See `rules/plan-mode.md` for plan mode augmentation (grill-first interview, atomic task schema, subagent dispatch).

## Notes Vault

Personal knowledge base at `~/Development/Notes` — read its `CLAUDE.md` for structure.
