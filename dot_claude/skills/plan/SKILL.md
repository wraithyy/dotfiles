---
name: plan
description: Restate requirements, assess risks, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
---

## Phase 1: Grill Me

Before planning, interview me relentlessly about every aspect of this task until we reach shared understanding. Walk down each branch of the decision tree, resolving dependencies one-by-one. For each question, provide your recommended answer. Ask questions one at a time. If a question can be answered by exploring the codebase, explore the codebase instead.

Do NOT proceed to Phase 2 until the grilling session is complete and I confirm we have shared understanding.

## Phase 2: Plan

After the grilling session, enter plan mode and produce:

1. **Requirements** — restate what we're building (informed by Phase 1)
2. **Risks** — list top risks and mitigations
3. **Steps** — numbered implementation steps, each scoped to a single file or concern
4. **Out of scope** — explicitly list what we're NOT doing

Then STOP. Do not write any code. Wait for explicit user confirmation ("yes", "go", "implement", "proceed") before touching any files.
