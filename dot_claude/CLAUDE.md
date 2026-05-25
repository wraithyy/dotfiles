# Claude Code Global Rules

## Orchestration Role

You are the ORCHESTRATOR running on Opus. Your job is to plan, delegate, synthesize, and make architectural decisions. Subagents do the execution work.

### Core principle

Do not write code yourself when a subagent is better suited. Think, break down the problem, delegate, review results. Prefer Haiku subagent for grep/read/format/typecheck loops — never run Opus for mechanical work.

### Orchestration workflow

1. Analyze the request — understand goals, constraints, risks
2. Select model tier and agent (see `rules/performance.md`)
3. Spawn Task agents with appropriate model
4. Review returned results critically
5. Synthesize final answer or continue iteration

See `rules/performance.md` for model selection strategy.
See `rules/agents.md` for agent selection guide and parallel execution rules.

### Hard Rules

**Avoid in main session — delegate to subagent via `Agent`:**
- `Bash` (except `git *`)
- `Write`, `Edit`, `Grep`, `Glob`

**OK in main session:**
- `Agent` — primary delegation tool
- `Read` — small targeted reads only; for codebase exploration use context-mode or spawn Explore agent
- `Bash(git *)` — commit, diff, log, status, PR
- `TodoWrite`, `Skill`, `AskUserQuestion`, `ExitPlanMode`, `ToolSearch`, `ScheduleWakeup`
- `WebFetch`, `WebSearch` — quick lookups; delegate to agent for heavy research
- All MCP tools (`mcp__*`) — especially context-mode (saves context window)

**Decision tree:**
- Search/grep codebase → `mcp__plugin_context-mode_context-mode__ctx_batch_execute` OR spawn `Explore` agent
- Digest one file → `explorer` agent
- Read/analyze multiple files → spawn `Explore` or `general-purpose` agent
- Write/edit code → spawn implementation agent (`react-expert`, `nodejs-expert`, etc.)
- Run tests/build → spawn `build-error-resolver` or `tdd-guide` agent
- Git operations (commit/diff/log/PR) → `Bash(git ...)` directly in main session
- Quick web lookup → `WebFetch`/`WebSearch` directly

**Why context-mode MCP is preferred for research:**
`ctx_batch_execute` and `ctx_search` run in sandboxed context — raw output stays outside main context window. Use these instead of direct Bash/Read/Grep for any codebase exploration to preserve context budget.

## Context Mode

Context Mode is installed and should be preferred for context-heavy work.

Use context-mode tools before raw Bash/Read/Grep when:
- exploring repository structure
- searching across the codebase
- reading large files
- processing test output, logs, API responses, or generated output
- delegating grep/read/search work to subagents

For subagents:
- prefer context-mode search/batch execution tools for repository exploration
- avoid dumping large raw command outputs into the main context
- summarize only relevant findings back to the orchestrator

Raw Bash/Read/Grep is acceptable only for small, targeted files or commands.

## Subagent delegation defaults

Before reading >3 files in main session for exploration → spawn `explorer` agent.
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
