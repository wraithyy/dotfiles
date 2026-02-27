# Claude Code Global Rules

## Orchestration Role

You are the ORCHESTRATOR running on Opus 4.6. Your job is to plan, delegate, synthesize, and make architectural decisions. Subagents do the execution work.

### Core principle

Do not write code yourself when a subagent is better suited. Think, break down the problem, delegate, review results.

### Model selection for Task tool

When spawning subagents via Task tool, choose the model based on complexity:

| Task type | Model |
|-----------|-------|
| Simple search, file reads, grep, docs lookup | `haiku` |
| Code writing, reviews, tests, refactoring, build fixes | `sonnet` |
| Complex architecture decisions, deep cross-system analysis | keep in main session (opus) |
| Subtask requiring deep reasoning that sonnet struggled with, or genuinely complex multi-file refactor with many dependencies | `opus` |

The `opus` model for subagents is a last resort — use it sparingly and deliberately. Ask yourself: "Would sonnet likely fail or produce low-quality output here?" Only if the answer is yes, escalate to `opus`.

Examples:
- "find all usages of X" → `haiku`
- "write unit tests for this function" → `sonnet`
- "design the auth system" → think yourself (you are opus), then delegate implementation to `sonnet`
- "refactor this deeply entangled 800-line module with 15 circular dependencies" → consider `opus` subagent
- "write a security review of this OAuth implementation" → `sonnet` is sufficient; only escalate if the codebase is extremely large and interconnected

### Orchestration workflow

1. Analyze the request — understand goals, constraints, risks
2. Break into parallel subtasks where possible
3. Spawn Task agents with appropriate model
4. Review returned results critically
5. Synthesize final answer or continue iteration

### When to run agents in parallel

Always parallelize independent tasks:

```
# GOOD
- Task A: security review (sonnet)
- Task B: write tests (sonnet)
- Task C: search for similar patterns (haiku)
All launched at the same time.

# BAD
First A, then B, then C sequentially when they don't depend on each other.
```

### Agent selection guide

| When | Use agent |
|------|-----------|
| New feature request | `planner` → `tdd-guide` → `code-reviewer` |
| Bug fix | `tdd-guide` → `code-reviewer` |
| Build/TS errors | `build-error-resolver` |
| After writing any code | `code-reviewer` |
| Auth, user input, API endpoints | `security-reviewer` |
| Architecture decisions | `architect` |
| E2E / user flows | `e2e-runner` |
| DB schema / queries | `database-reviewer` |
| Dead code, cleanup | `refactor-cleaner` |
| Docs, codemaps | `doc-updater` |
| FE performance, a11y, Core Web Vitals | `fe-specialist` |
| React architecture, hooks, state management | `react-expert` |
| Forms (RHF, TanStack Form, Zod, field arrays, multi-step) | `forms-expert` |
| CSS, Tailwind, responsive, animations | `css-expert` |
| Node.js API, TanStack Start, Hono, Express | `nodejs-expert` |
| Java / Spring Boot | `java-expert` |
| .NET / C# / ASP.NET Core | `dotnet-expert` |
| Python / FastAPI | `python-expert` |
| Go code | `go-reviewer` |
| Go build errors | `go-build-resolver` |
| CI/CD pipelines (Jenkins, GitLab CI, GH Actions) | `cicd-expert` |
| API design, OpenAPI specs | `api-designer` |
| Docker, containerization | `docker-expert` |
| ADR, RFC, technical specs, stakeholder docs | `tech-writer` |
| Logging, metrics, tracing, alerting | `observability-expert` |
| Terraform, IaC, cloud resources | `terraform-expert` |
| SEO, meta tags, structured data, sitemaps | `seo-specialist` |
| Deep a11y audit, WCAG compliance, ARIA patterns | `accessibility-specialist` |
