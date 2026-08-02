# MCP Servers

| Server | Purpose |
|---|---|
| chrome-devtools | live DOM, console, network debugging |
| playwright | browser automation, E2E |
| browsermcp | drives your own logged-in Chrome via extension |
| web-fetch | page fetch/crawl to Markdown (fetcher-mcp, Playwright) |
| gitlab | Trask GitLab (token from 1Password at install time) |

Context7 = plugin `context7@claude-plugins-official`, NOT an MCP server.
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

Docs research: official URLs first (or Context7 for libraries), smallest useful
page set, sitemap/index before crawling links, summarize instead of dumping raw
page text, and say when content may be incomplete (auth, anti-bot, JS render,
truncation).
