# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Enforced by cc-guard (Claude PreToolUse hook + global git commit-msg hook):
conventional subject, no emoji, `Co-Authored-By: Claude*` trailers stripped.
Work repos under ~/Development/trask/ skip the format check (gitconfig-trask).

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

## Feature Implementation Workflow

1. **Plan First**
   - Use built-in `Plan` agent (or plan mode) to create implementation plan
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
