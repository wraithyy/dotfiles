# Agent Orchestration

Agents live in `~/.claude/agents/`. Unused/disabled agents restore from
`~/.claude/agents-disabled/` (language sets: Java, .NET, Python, Go,
Terraform, DB; plus 2026-08 usage-trim: ai-context-optimizer,
ai-tooling-expert, api-designer, build-error-resolver, css-expert,
docker-expert, forms-expert, observability-expert).

## Available Agents

### Quality & Process
| Agent | Use for |
|---|---|
| planner | implementation plans for complex features/refactors |
| architect | system design, architectural decisions |
| tdd-guide | write-tests-first for features and bug fixes |
| code-reviewer | review after writing code |
| security-reviewer | OWASP gate before commits |
| e2e-runner | Playwright E2E flows |
| refactor-cleaner | dead code removal (knip/ts-prune) |
| doc-updater | codemaps and docs |

### Frontend
| Agent | Use for |
|---|---|
| fe-specialist | Core Web Vitals, bundle, rendering perf |
| react-expert | hooks, state mgmt, TanStack Router/Query, component design |
| accessibility-specialist | WCAG 2.1 AA, ARIA, keyboard nav |
| seo-specialist | meta, structured data, sitemaps |

### Backend / Infra / Docs
| Agent | Use for |
|---|---|
| nodejs-expert | TanStack Start, Hono, Express/Fastify, API routes |
| cicd-expert | GitHub Actions, GitLab CI |
| it-analyst | requirements analysis, Jira breakdown |
| tech-writer | ADRs, RFCs, specs, runbooks |
| fe-estimator | FE estimates in man-days |

### Exploration
| Agent | Use for |
|---|---|
| explorer | Haiku read-only codebase digest (>3 files to read) |

`Explore` (built-in) = quick lookups, single grep. `explorer` (custom, Haiku) =
multi-file digest, structured summary — prefer for file digestion.

## When to delegate

Name the agent when the task fits one: dead code sweeps (refactor-cleaner),
code-reviewer for significant changes, security-reviewer before committing
auth/security/payment code. The model self-verifies routine edits — don't
spawn review agents for those. No file-count or context-percent thresholds:
iterative shared-context work stays in the main session (subagents cost ~4x
tokens and restart context from zero).

## Parallel delegation (single message, multiple Agent calls)

- major change: code-reviewer + security-reviewer (+ accessibility-specialist for UI)
- new API: nodejs-expert + tdd-guide

## Evidence contract (mandatory in every delegated prompt)

Subagents have falsely claimed passing checks (e2e hit an unrelated app on
port 3000; GitLab lint never ran). Every prompt that asks an agent to verify
anything MUST include:

> End your report with a VERIFICATION block: exact commands run, exit codes,
> last 10 lines of raw output. Any claim without pasted output = report it as
> UNVERIFIED. For dev-server/e2e checks, prove the port belongs to this
> project (fetch a known route) before trusting results.

Orchestrator side: never relay an agent's "passed" to the user without an
evidence block; re-run the critical check in the main session if it's missing.

## Cost hints for delegated prompts

"Cap response at 500 words" / "file paths only, no code blocks" / "skip files <50 LOC".
