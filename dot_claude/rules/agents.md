# Agent Orchestration

## Available Agents

Located in `~/.claude/agents/`:

### Quality & Process
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| build-error-resolver | Fix build errors | When build fails |
| e2e-runner | E2E testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation | Updating docs |

### Frontend
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| fe-specialist | FE performance, Core Web Vitals, TanStack | FE optimization, perf audits |
| react-expert | React patterns, hooks, TanStack Router/Query, shadcn, MUI, type-safety | React architecture, component design |
| css-expert | Tailwind, cva, responsive design, animations | Styling, design systems |
| forms-expert | React Hook Form, TanStack Form, Zod validation | Form implementation |
| accessibility-specialist | WCAG 2.1 AA, ARIA, keyboard nav, screen readers | A11y audits, accessible components |
| seo-specialist | Meta tags, structured data, sitemaps, Core Web Vitals | SEO implementation, audits |

### Backend
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| nodejs-expert | TanStack Start, Hono, Express/Fastify, server functions | Node.js/JS backend, API routes |

> Java, .NET, Python, Go, Terraform, database agents disabled. Restore from `~/.claude/agents-disabled/` when needed.

### Infrastructure & DevOps
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| cicd-expert | GitHub Actions, GitLab CI, Jenkins pipelines | CI/CD setup and optimization |
| docker-expert | Multi-stage builds, Compose, security | Containerization |
| observability-expert | OpenTelemetry, Prometheus, Grafana, structured logging | Monitoring, alerting |

### Analysis & Documentation
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| it-analyst | Requirements analysis, structured docs, Jira task breakdown | Business/IT analysis, requirements gathering |
| api-designer | OpenAPI 3.1, REST conventions, contract-first | API design, documentation |
| tech-writer | ADRs, RFCs, technical specs, runbooks | Technical documentation |

### AI Tooling & Automation
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| ai-tooling-expert | Claude Code, OpenClaw, ACP, MCP config and workflow automation | Setting up, configuring, or troubleshooting AI tools |
| ai-context-optimizer | Context window optimization, memory management, token efficiency | Optimizing prompts, reducing token waste, memory hygiene |

### Exploration
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| explorer | Fast read-only codebase digest, file structure overview | Reading >3 files for context, onboarding to unfamiliar code |

## Immediate Agent Usage

No user prompt needed:
1. Complex feature requests - Use **planner** agent
2. Code just written/modified - Use **code-reviewer** agent
3. Bug fix or new feature - Use **tdd-guide** agent
4. Architectural decision - Use **architect** agent

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth.ts
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utils.ts

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## Multi-Perspective Analysis

For complex problems, use split role sub-agents:
- Factual reviewer
- Senior engineer
- Security expert
- Consistency reviewer
- Redundancy checker

## Delegation Triggers

### Always delegate (never do in main session)

| Situation | Agent | Why |
|---|---|---|
| Need to understand unfamiliar code area | `explorer` | Haiku digest cheaper than main session reads |
| Reading >3 files for context | `explorer` | Same |
| Build error appears | `build-error-resolver` | Haiku specialist |
| Type error appears | `build-error-resolver` | Same |
| Dead code suspected | `refactor-cleaner` | Haiku, deterministic via knip/ts-prune |
| Test missing for new code | `tdd-guide` | Sonnet, write-tests-first |
| Code just written | `code-reviewer` | Sonnet, immediate post-edit |
| About to commit | `security-reviewer` | Sonnet, OWASP gate |

### Parallel delegation (run in single message)

For complex tasks, dispatch 2-3 agents in parallel:

- After major code change: `code-reviewer` + `security-reviewer` + `accessibility-specialist`
- New API: `api-designer` + `nodejs-expert` + `tdd-guide`
- New form: `forms-expert` + `accessibility-specialist`

### Explore agent vs explorer agent

- `Explore` (built-in) — quick code lookups, single grep
- `explorer` (custom) — multi-file digest, codebase onboarding, structured summary

For file digestion: prefer `explorer` (cheaper Haiku, structured output).

### Cost budget hints

When delegating, include in prompt:
- "Cap response at 500 words" — forces digest
- "Reference file paths only, no code blocks" — saves output tokens
- "Skip files <50 LOC" — focus on substance
