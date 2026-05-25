# Plan Mode Augmentation

## Phase 0: Grill-First (MANDATORY, runs before harness Phase 1)

Before spawning any Explore agents, conduct a grill-me interview:

- Ask one question at a time
- For each question, provide your recommended answer
- If a question can be answered by reading the codebase, explore the codebase instead — don't ask
- Continue until the user confirms shared understanding
- Only then proceed to Phase 1 (Explore agents)

## Plan File: Atomic Task Schema

The final plan file MUST break work into atomic tasks. Each task = one file or one concern, independently verifiable.

Use this schema for every task block:

```md
## Task N.M: <imperative verb + object>
- **Agent**: <agent-name from rules/agents.md>
- **Files**: <path(s) to touch>
- **Depends on**: <task IDs or "none">
- **Acceptance**: <how to verify — pnpm test / tsc / manual step>
- **Prompt seed**: <1-2 sentence brief the orchestrator pastes into the Agent call>
```

Assign agents from the table in `rules/agents.md`. Default Haiku for mechanical tasks, Sonnet for implementation, Opus only for architecture.

Tasks with no shared dependencies can be dispatched in parallel via a single `Agent` message with multiple tool calls.

## Required Sections in Plan File

1. **Context** — why this change, what problem it solves
2. **Requirements** — what we're building (informed by grill phase)
3. **Risks** — top risks + mitigations
4. **Tasks** — numbered atomic blocks using the schema above
5. **Out of scope** — explicitly what we're NOT doing
6. **Verification** — end-to-end test plan (run app, run tests, use MCP tools)
