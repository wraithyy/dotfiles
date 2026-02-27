# Performance Optimization

## Model Selection Strategy

**Opus 4.6** (`claude-opus-4-6`) — Main session orchestrator:
- Runs as the primary Claude Code session
- Orchestrates subagents via the Task tool
- Decides which model each subagent should use

**Haiku 4.5** (`claude-haiku-4-5-20251001`) — Fast and cheap:
- File reads, searches, and lookups
- Lightweight worker agents with frequent invocation
- Tasks where speed and cost matter more than depth

**Sonnet 4.6** (`claude-sonnet-4-6`) — Primary workhorse:
- Code generation, reviews, and refactoring
- Most subagent tasks (default choice)
- Complex multi-file changes

**Opus 4.6** (for subagents, use sparingly):
- Genuinely hard architectural decisions
- Tasks where Sonnet repeatedly fails
- Deep reasoning requirements — escalate deliberately, not by default

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
