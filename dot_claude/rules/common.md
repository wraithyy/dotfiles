# Global Rules for Claude Code

## Session Initialization

At start of each new session:

1. Use MCP `time` tool to get current time and date
2. When Context7 available, search relevant docs for used libraries and frameworks

## Coding Standards

### TypeScript

- **NEVER use `any` type** if avoidable
- Prefer explicit types or type inference
- If `any` unavoidable, add comment explaining why

### Comments

- Add **only necessary comments**
- Comments explain "why", not "what"
- Avoid redundant comments that merely describe code

### Emoji

- **DO NOT use emoji** in code, commit messages, or comments
- Exception only when explicitly requested

## Documentation

- When working with libraries/frameworks, **always use Context7** for up-to-date docs
- Before implementing, check available docs via Context7
