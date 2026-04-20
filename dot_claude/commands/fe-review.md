# Frontend Review

Comprehensive FE code review of recent changes. Launch all agents in parallel:

1. **code-reviewer** — security, quality, CRITICAL/HIGH issues in changed files
2. **react-expert** — hooks correctness, state management, rendering patterns, TanStack usage
3. **fe-specialist** — Core Web Vitals impact, bundle size, performance anti-patterns, a11y basics
4. **accessibility-specialist** — WCAG 2.1 AA compliance, ARIA, keyboard navigation (only if UI components changed)

Each agent should:
- Run `git diff --name-only HEAD` to identify changed files
- Focus analysis on FE source files (`.tsx`, `.ts`, `.css`)
- Skip non-FE changes (CI config, docs, migrations)

Consolidate findings into one report:
- CRITICAL: blocks merge
- HIGH: fix before merge
- MEDIUM: fix soon
- LOW: nice to have

Severity CRITICAL or HIGH → block and list specific fixes with file:line references.
