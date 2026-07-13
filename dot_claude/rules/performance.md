# Performance: Model Routing

Target distribution: 70% Haiku / 20% Sonnet / 10% Opus.

| Agent tier | Model | Examples |
|---|---|---|
| Mechanical — narrow, rule-check | haiku | build-error-resolver, doc-updater, refactor-cleaner, e2e-runner, accessibility-specialist, api-designer, cicd-expert, css-expert, docker-expert, forms-expert, seo-specialist, explorer |
| Implementation — code write, review | sonnet | react-expert, fe-specialist, code-reviewer, security-reviewer, tdd-guide, tech-writer, ai-context-optimizer, fe-estimator, other workers |
| Architecture — deep reasoning | opus | architect, planner, ai-tooling-expert |

| Task type | Model |
|---|---|
| grep, file reads, docs lookup, formatting | haiku |
| code writing, reviews, tests, refactoring | sonnet |
| architecture, cross-system analysis | opus (main session) |
| deep reasoning where sonnet failed | opus (subagent last resort) |

With `opusplan` active, main session already routes planning->Opus,
implementation->Sonnet. Don't pass `model: opus` to workers unless Sonnet
failed on that specific task.

## Context window

Avoid last 20% of context for: large refactors, multi-file features, complex
debugging. Low-sensitivity: single-file edits, utilities, docs, simple fixes.
