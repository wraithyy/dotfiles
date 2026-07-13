# Agent Orchestration

Agents live in `~/.claude/agents/`. Disabled sets (Java, .NET, Python, Go,
Terraform, DB) restore from `~/.claude/agents-disabled/`.

## Available Agents

### Quality & Process
| Agent | Use for |
|---|---|
| planner | implementation plans for complex features/refactors |
| architect | system design, architectural decisions |
| tdd-guide | write-tests-first for features and bug fixes |
| code-reviewer | review after writing code |
| security-reviewer | OWASP gate before commits |
| build-error-resolver | build/type errors, minimal diffs |
| e2e-runner | Playwright E2E flows |
| refactor-cleaner | dead code removal (knip/ts-prune) |
| doc-updater | codemaps and docs |

### Frontend
| Agent | Use for |
|---|---|
| fe-specialist | Core Web Vitals, bundle, rendering perf |
| react-expert | hooks, state mgmt, TanStack Router/Query, component design |
| css-expert | Tailwind, cva, responsive, animations |
| forms-expert | RHF/TanStack Form + Zod |
| accessibility-specialist | WCAG 2.1 AA, ARIA, keyboard nav |
| seo-specialist | meta, structured data, sitemaps |

### Backend / Infra
| Agent | Use for |
|---|---|
| nodejs-expert | TanStack Start, Hono, Express/Fastify, API routes |
| cicd-expert | GitHub Actions, GitLab CI |
| docker-expert | Dockerfiles, Compose, image security |
| observability-expert | OTel, Prometheus, Grafana, logging |

### Analysis & Docs
| Agent | Use for |
|---|---|
| it-analyst | requirements analysis, Jira breakdown |
| api-designer | OpenAPI 3.1, contract-first |
| tech-writer | ADRs, RFCs, specs, runbooks |
| fe-estimator | FE estimates in man-days |

### AI Tooling & Exploration
| Agent | Use for |
|---|---|
| ai-tooling-expert | Claude Code / OpenClaw / MCP config |
| ai-context-optimizer | token efficiency, memory hygiene |
| explorer | Haiku read-only codebase digest (>3 files to read) |

`Explore` (built-in) = quick lookups, single grep. `explorer` (custom, Haiku) =
multi-file digest, structured summary — prefer for file digestion.

## Delegation triggers

Follow CLAUDE.md thresholds: <=3 files direct, >5 delegate, context >60% always
delegate. Additionally always delegate: build/type errors (build-error-resolver),
dead code sweeps (refactor-cleaner), post-edit review (code-reviewer),
pre-commit security (security-reviewer).

## Parallel delegation (single message, multiple Agent calls)

- major change: code-reviewer + security-reviewer (+ accessibility-specialist for UI)
- new API: api-designer + nodejs-expert + tdd-guide
- new form: forms-expert + accessibility-specialist

## Cost hints for delegated prompts

"Cap response at 500 words" / "file paths only, no code blocks" / "skip files <50 LOC".
