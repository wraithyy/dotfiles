# Performance Optimization

## Model Selection for Subagents

Target distribution: **70% Haiku / 20% Sonnet / 10% Opus**.

| Agent tier | Model | Examples |
|-----------|-------|---------|
| Mechanical — narrow, rule-check | `haiku` | build-error-resolver, doc-updater, refactor-cleaner, e2e-runner, accessibility-specialist, api-designer, cicd-expert, css-expert, docker-expert, forms-expert, seo-specialist, explorer |
| Implementation — code write, review | `sonnet` | react-expert, fe-specialist, code-reviewer, security-reviewer, tdd-guide, tech-writer, ai-context-optimizer, fe-estimator, all other workers |
| Architecture — deep reasoning | `opus` | architect, planner, ai-tooling-expert |

| Task type | Model |
|-----------|-------|
| Grep, file reads, docs lookup, formatting | `haiku` |
| Code writing, reviews, tests, refactoring | `sonnet` |
| Architecture decisions, cross-system analysis | `opus` (main session) |
| Deep reasoning where sonnet failed | `opus` (last resort for subagent) |

When `opusplan` is active, the main session already routes planning→Opus and implementation→Sonnet via the model alias. Do not pass `model: opus` to worker agents unless Sonnet reasoning failed on this specific task.

## Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks:
- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

## Ultrathink + Plan Mode

For complex tasks requiring deep reasoning:
1. Use `ultrathink` for enhanced thinking
2. Enable **Plan Mode** for structured approach
3. "Rev the engine" with multiple critique rounds
4. Use split role sub-agents for diverse analysis

## Build Troubleshooting

If build fails:
1. Use **build-error-resolver** agent
2. Analyze error messages
3. Fix incrementally
4. Verify after each fix
