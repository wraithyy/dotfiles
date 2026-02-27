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
| java-expert | Spring Boot, JPA, MapStruct, testing | Java services |
| dotnet-expert | ASP.NET Core, MediatR, EF Core, C# patterns | .NET services |
| python-expert | FastAPI, Pydantic v2, SQLAlchemy async, pytest | Python services |

### Infrastructure & DevOps
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| cicd-expert | GitHub Actions, GitLab CI, Jenkins pipelines | CI/CD setup and optimization |
| docker-expert | Multi-stage builds, Compose, security | Containerization |
| terraform-expert | IaC, modules, state, cloud resources | Infrastructure as code |
| observability-expert | OpenTelemetry, Prometheus, Grafana, structured logging | Monitoring, alerting |

### Design & Documentation
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| api-designer | OpenAPI 3.1, REST conventions, contract-first | API design, documentation |
| tech-writer | ADRs, RFCs, technical specs, runbooks | Technical documentation |

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
