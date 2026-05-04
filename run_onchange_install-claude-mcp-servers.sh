#!/bin/bash
# Install Claude Code MCP servers at user scope.
# chezmoi re-runs this whenever its content changes.

set -euo pipefail

command -v claude >/dev/null 2>&1 || { echo "claude CLI not found, skipping MCP install"; exit 0; }

existing=$(claude mcp list 2>/dev/null || true)

add_if_missing() {
  local name="$1"
  shift
  if echo "$existing" | grep -q "^${name}:"; then
    echo "mcp '${name}' already present"
  else
    echo "installing mcp '${name}'"
    claude mcp add "$name" --scope user -- "$@"
  fi
}

add_if_missing chrome-devtools npx -y chrome-devtools-mcp@latest
add_if_missing playwright      npx -y @playwright/mcp@latest
add_if_missing webclaw         /opt/homebrew/bin/webclaw-mcp
add_if_missing browser-mcp     npx @browsermcp/mcp
add_if_missing lmstudio        uv run "$HOME/.claude/mcp/lmstudio_mcp.py"
