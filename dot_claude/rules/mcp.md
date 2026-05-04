# MCP Servers

## Active

| Server | Purpose | Usage |
|--------|---------|-------|
| `context7` | Official library docs (React, TanStack, Vite, etc.) | Always use before implementing with a library — beats stale model knowledge |
| `chrome-devtools` | Runtime DOM inspection, console, network tab | FE debugging: inspect live state, catch network errors, read console output |
| `playwright` | Automated browser control + assertions | E2E test writing, bug reproduction, UI smoke testing |
| `webclaw` | Web scraping, crawling, extraction, research | Content extraction, competitive research, documentation mining |
| `browser-mcp` | Lightweight browser automation | Quick page interactions when Playwright/Chrome DevTools are overkill |
| `time` | Current date/time | Session init |

## Install / Restore

Managed by chezmoi script `~/.local/share/chezmoi/run_onchange_install-claude-mcp-servers.sh` — runs on `chezmoi apply` and installs any missing servers.

Manual install (single server):
```bash
claude mcp add <name> --scope user -- <command>
```

Permissions already allowed in `settings.json` (via `mcp__*` patterns or explicit entries).

## Local / Optional

| Server | Purpose | Usage |
|--------|---------|-------|
| `lmstudio` | Local Qwen2.5-Coder-7B via LM Studio (port 1234) | Free inference for exploration pipeline. Tools: `digest_path`, `batch_digest`, `explore_dir`, `find_symbol`, `summarize_diff`, `ask`. Requires LM Studio running. |

**When to use lmstudio vs Haiku:**
- lmstudio = free but requires LM Studio open; good for exploration/summarization
- Haiku = reliable, fast, always available; use when LM Studio not running or for critical tasks

**Script:** `~/.claude/mcp/lmstudio_mcp.py` (managed by chezmoi)

## Optional / Future

- **shadcn-mcp** — consistent shadcn/ui component scaffolding
- **figma-mcp** — design handoff to code when using Figma
