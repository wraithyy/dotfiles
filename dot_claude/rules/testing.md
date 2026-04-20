# Testing Requirements

## Test Coverage: 80% for business logic

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

## Test-Driven Development

Recommended workflow for features and bug fixes:
1. Write test first (RED)
2. Run test — should FAIL
3. Write minimal implementation (GREEN)
4. Run test — should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+ on in-scope code)

TDD is **mandatory for bug fixes** (regression test proves fix).

## Test Types

1. **Unit Tests** — utilities, hooks, transforms
2. **Integration Tests** — API calls, store interactions
3. **E2E Tests** — critical user flows (Playwright)

## Troubleshooting

1. Use **tdd-guide** agent
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)

## Agent Support

- **tdd-guide** — Use PROACTIVELY for new features, enforces write-tests-first
- **e2e-runner** — Playwright E2E testing specialist
