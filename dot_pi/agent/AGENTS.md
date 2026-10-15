# Global Rules

## Context economy

- Research/grep/log processing -> context-mode tools (`ctx_batch_execute`,
  `ctx_search`): raw output stays sandboxed, only the summary enters context.
- Library/framework/SDK questions -> `context7` skill first (beats stale
  knowledge); tell delegated agents the same.

## Conventions

- Language: Czech only for chat with me. Everything written to files (docs,
  AGENTS.md, READMEs, code comments, commits, PRs) in English.
- No emoji in code/commits/comments (unless asked).
- Comments explain why, not what; only necessary ones.
- TypeScript: never `any` without a justifying comment.
- Questions with options are always clickable: whenever you would offer me
  choices (A/B/C, "option 1/2", yes/no with alternatives, picking a direction),
  call `ask_user_question` (in plan mode: `plan_mode_question`). Never write
  the options as a list in chat and wait for a typed answer. Put your
  recommendation first and mark it "(Recommended)". Plain-text questions only
  for genuinely open-ended input with no sensible options.

## Notes Vault

Personal knowledge base at `~/Development/Notes`; read its `CLAUDE.md` for structure.

## Agent Orchestration

Delegate with the `Agent` tool (`subagent_type` = agent name). Built-ins:
`general-purpose` (full tools, inherits these rules), `Explore` (read-only
search), `Plan` (read-only design). Custom agents live in `~/.pi/agent/agents/`:

| Agent | Use for |
|---|---|
| react-expert | hooks, state mgmt, TanStack Router/Query, component design |
| nodejs-expert | TanStack Start, Hono, Express/Fastify, API routes |
| tdd-guide | write-tests-first for features and bug fixes |
| code-reviewer | review after significant changes |
| security-reviewer | OWASP gate before committing auth/security/payment code |
| doc-updater | codemaps and docs |
| tech-writer | ADRs, RFCs, specs, runbooks |

Agents pin their own model in frontmatter; don't override models per task.

### When to delegate

Name the agent when the task fits one. Routine edits: self-verify, no review
agent. Iterative shared-context work stays in the main session.

Independent tasks go out in parallel (several `Agent` calls in one turn, or
background agents). Fan-out work with phases, many items, or verification
gates goes through `SubagentWorkflow` (`agent()`, `parallel()`, `pipeline()`,
`phase()`, `gate: "<command>"`); use `isolation: "worktree"` when parallel
agents edit overlapping files.

- major change: code-reviewer + security-reviewer in parallel
- new API: nodejs-expert + tdd-guide

### Evidence contract (mandatory in every delegated prompt)

Every prompt that asks an agent to verify anything MUST include:

> End your report with a VERIFICATION block: exact commands run, exit codes,
> last 10 lines of raw output. Any claim without pasted output = report it as
> UNVERIFIED. For dev-server/e2e checks, prove the port belongs to this
> project (fetch a known route) before trusting results.

Never relay an agent's "passed" without the evidence block; re-run the critical
check yourself if it's missing. Treat "should work", "should now pass", "vše
ověřeno", or a green summary without command output as UNVERIFIED. Judge the
diff, not the report; review test-file diffs stricter than code diffs
(weakened assertions, `.skip`).

Cost hints for delegated prompts: "Cap response at 500 words", "file paths
only, no code blocks".

## Planning and big work

Pick the lightest workflow that fits:

| Size | Workflow |
|---|---|
| small, clear change | just do it; self-verify |
| medium (a few files, some decisions) | `/plan` (read-only), grill with `plan_mode_question`, then implement |
| large feature / multi-day / many tasks | superpowers: `brainstorming` -> spec -> `writing-plans` -> `subagent-driven-development` |
| long autonomous run with a done-condition | `/goal` (pi-goal-x) with the completion auditor |
| architecture / design questions | `improve-codebase-architecture`, `codebase-design`, `domain-modeling`; `grill-with-docs` when a spec or docs exist |

Plan mode rules: resolve high-impact decisions first (one topic at a time, each
with your recommended option; `grill-me` has the method; explore instead of
asking when the codebase can answer). Explore wide areas through parallel
`Agent` calls with `subagent_type: Explore`. The plan covers context,
requirements, risks, atomic tasks (agent, files, verification command,
file-disjoint marker), out of scope, end-to-end verification.

### Superpowers: overrides (these rules win over the skills)

- Commits: only inside a feature worktree/branch created for the work
  (`using-git-worktrees`). Commit steps from plans and SDD run there. Never
  commit in the main checkout; there, leave changes uncommitted for me.
  Merge, push, PR, and branch deletion (`finishing-a-development-branch`)
  always wait for my explicit go.
- Specs and plans go to `docs/superpowers/specs/` and `docs/superpowers/plans/`
  but are never committed (skip "commit the design document"); add
  `docs/superpowers/` to `.git/info/exclude` if it is not ignored yet. Do not
  edit `.gitignore` for this.
- Worktrees: prefer the subagent tool's `isolation: "worktree"` and herdr
  workspaces over manual `git worktree add`; if `.gitignore` would need a
  change to ignore the worktree dir, use `.git/info/exclude` instead.
- TDD and review skills drive the process; delegate the work to `tdd-guide`
  and `code-reviewer`/`security-reviewer`, with the evidence contract.
- Clarifying questions and design choices in `brainstorming`/`grill-me`/
  `grill-with-docs` go through `ask_user_question` (one question per call,
  options + recommendation), not "conversationally" or as A/B/C text in chat.
- Chat stays Czech, files English (Conventions above).

## Tools (no MCP)

pi has no MCP. External systems go through CLIs and skills:

| Need | Use |
|---|---|
| browser automation, frontend testing, DOM/console, screenshots | `browser-tools` skill (CDP scripts, Chrome on :9222) |
| library/framework docs | `context7` skill (ctx7 CLI) |
| GitLab (Trask) | `glab` with `GITLAB_HOST=gitlab.trask.cz` (own stored token) |
| GitHub | `gh` |
| large outputs, logs, research | context-mode `ctx_*` tools |

### Web fetching

Order, stop at the first that works:

1. `ctx_fetch_and_index` for simple public pages (docs, articles, READMEs,
   changelogs, API refs); raw text stays in the sandbox.
2. `browser-tools` (`browser-nav.js` + `browser-content.js`) for JS-rendered
   pages or when step 1 returns empty/incomplete content.
3. `curl` via `ctx_execute` only when both fail.

Never default to Docker crawlers, paid hosted crawlers, or a local LLM.
Official URLs first, smallest useful page set, sitemap/index before crawling,
summarize instead of dumping raw text, and say when content may be incomplete
(auth, anti-bot, JS render, truncation).

---
paths:
  - "**/*.{ts,tsx,js,jsx}"
---

## Coding Style

### Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

### File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large components
- Organize by feature/domain, not by type

### Error Handling

ALWAYS handle errors comprehensively:

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

### Input Validation

ALWAYS validate user input:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

### TypeScript Type Casts

AVOID type casts (`as`, `!`, `<Type>`) when possible. Prefer type-safe alternatives:

```typescript
// WRONG: Type cast
const el = document.getElementById('app') as HTMLDivElement
const val = maybeNull!.value

// CORRECT: Type guard / narrowing
const el = document.getElementById('app')
if (!(el instanceof HTMLDivElement)) throw new Error('Missing #app')

const val = maybeNull?.value
```

When a cast is truly unavoidable, add a comment explaining why.

### Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
- [ ] No unnecessary type casts

## Git Workflow

### Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci


### Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

### Feature Implementation Workflow

1. **Plan First**
   - Use plan mode (`/plan`) to create the implementation plan
   - Identify dependencies and risks
   - Break down into phases

2. **TDD Approach**
   - Use **tdd-guide** agent
   - Write tests first (RED)
   - Implement to pass tests (GREEN)
   - Refactor (IMPROVE)
   - Verify 80%+ coverage

3. **Code Review**
   - Use **code-reviewer** agent for significant changes (multi-file,
     auth/security/payments, breaking API); routine edits self-review
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Detailed commit messages
   - Follow conventional commits format

## Security Guidelines

### Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

### Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx"

// ALWAYS: Environment variables
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

### Security Response Protocol

If security issue found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues

---
paths:
  - "**/*.{ts,tsx,js,jsx}"
---

## Testing Requirements

### Test Coverage: 80% for business logic

Coverage mandate applies to **feature and business logic only**:
- Custom hooks with state/side effects
- Utility functions and transformations
- API integration layer
- Form validation logic
- State management (stores, reducers)

**No coverage requirement for:**
- Pure UI wiring and component rendering
- CSS/Tailwind styling code
- Config files and scaffolding
- Generator output
- Throw-away prototypes

### Test-Driven Development

Workflow for features and bug fixes:
1. Write test first (RED)
2. Run test — should FAIL
3. Write minimal implementation (GREEN)
4. Run test — should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+ on in-scope code)

TDD is **mandatory for bug fixes** (regression test proves fix).

### Test Types

1. **Unit Tests** — utilities, hooks, transforms
2. **Integration Tests** — API calls, store interactions
3. **E2E Tests** — critical user flows (Playwright)

### Troubleshooting

1. Use **tdd-guide** agent
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)

### Agent Support

- **tdd-guide** — Use for new features; enforces write-tests-first

## tmux/herdr workflow

Sessions run in a multiplexer: nvim in one pane, pi in another,
dev server / tests in sibling panes. Detect which: `$HERDR_ENV` = herdr,
`$TMUX` = tmux (migration to herdr in progress, both may appear).

- Read sibling panes instead of asking the user to paste (dev server output,
  test runs, stacktraces).
  - herdr: `herdr pane list` (JSON, includes agent state), read with
    `herdr pane read <pane_id> --source recent-unwrapped`
  - tmux: `tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_current_command}'`,
    read with `tmux capture-pane -p -t <target>`
- Leave changes uncommitted after a task; the user reviews in Diffview /
  gitsigns / lazygit and commits when ready. Commit only when asked.
- nvim autoreads edited files (autoread + checktime), so don't tell the user
  to reload after you edit.
