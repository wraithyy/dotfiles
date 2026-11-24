# MCP Servers

| Server | Purpose |
|---|---|
| chrome-devtools | live DOM, console, network debugging (local scope: Promptheus) |
| playwright | browser automation, E2E (local scope: ilmari, pinpoint) |
| web-fetch | page fetch/crawl to Markdown (fetcher-mcp, Playwright) |
| gitlab | Trask GitLab (token from 1Password at install time) |

Browser MCPs are local-scoped, not user-scoped: each session spawns its own
npx+node pair per server.

When a task would benefit from a real browser (verifying UI changes, E2E
flows, DOM/console/network debugging, screenshots) and no `mcp__playwright__*`
/ `mcp__chrome-devtools__*` tools are loaded in this session:

- Say so once, in one line, and offer the command for the user to run with the
  `!` prefix (MCP tools load only after a session restart / `/mcp` reconnect):
  - playwright (E2E, automation): `! claude mcp add playwright --scope local -- npx -y @playwright/mcp@latest --ignore-https-errors`
  - chrome-devtools (DOM, perf, network): `! claude mcp add chrome-devtools --scope local -- npx -y chrome-devtools-mcp@latest`
- Never add it at user scope, and never write it into the repo's `.mcp.json`
  (shared with teammates) unless asked.
- Meanwhile fall back to what exists: the project's own e2e runner, or
  claude-in-chrome if it is connected.
- After the user adds one, offer to append the project to
  `add_local_if_missing` in `run_onchange_install-claude-mcp-servers.sh.tmpl`
  so it survives a reinstall.

Install/restore: `chezmoi apply` runs `run_onchange_install-claude-mcp-servers.sh.tmpl`
(idempotent, guards missing binaries). Manual: `claude mcp add <name> --scope user -- <cmd>`.

## Web Fetching

Order — stop at first that works:

1. `ctx_fetch_and_index` (context-mode) — simple public single pages: docs,
   articles, READMEs, changelogs, API refs. Raw text stays in sandbox.
2. `web-fetch` MCP (fetcher-mcp) — JS-rendered pages, incomplete/empty result
   from step 1, repeated fetches across related pages, lightweight crawl,
   cleaner Markdown/HTML extraction.
3. native `WebFetch` — only when both above fail.

Never default to: Docker-based crawlers, paid hosted crawlers (Firecrawl,
Webcrawl), local LLM. Local model (Ollama) only if structured extraction /
classification over many pages is actually needed.

Docs research: official URLs first, smallest useful
page set, sitemap/index before crawling links, summarize instead of dumping raw
page text, and say when content may be incomplete (auth, anti-bot, JS render,
truncation).
