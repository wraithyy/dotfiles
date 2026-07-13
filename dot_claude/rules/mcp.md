# MCP Servers

| Server | Purpose |
|---|---|
| chrome-devtools | live DOM, console, network debugging |
| playwright | browser automation, E2E |
| webclaw | scraping/crawling/research (brew binary, guarded) |
| gitlab | Trask GitLab (token from 1Password at install time) |
| time | current date/time (session init) |

Context7 = plugin `context7@claude-plugins-official`, NOT an MCP server.
Install/restore: `chezmoi apply` runs `run_onchange_install-claude-mcp-servers.sh.tmpl`
(idempotent, guards missing binaries). Manual: `claude mcp add <name> --scope user -- <cmd>`.
