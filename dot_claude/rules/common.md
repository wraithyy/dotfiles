# Global Rules for Claude Code

## Session Initialization

At the beginning of each new session:

1. Always use the MCP `time` tool to get the current time and date
2. When Context7 is available, search for relevant documentation for used libraries and frameworks

## Coding Standards

### TypeScript

- **NEVER use `any` type** if it can be avoided
- Prefer explicit types or type inference
- If `any` is unavoidable, add a comment explaining why

### Comments

- Add **only necessary comments**
- Comments should explain "why", not "what"
- Avoid redundant comments that merely describe the code

### Emoji

- **DO NOT use emoji** in code, commit messages, or comments
- Exception only when explicitly requested by the user

## Documentation

- When working with libraries/frameworks, **always use Context7** to get up-to-date documentation
- Before implementing functionality, check available documentation via Context7
