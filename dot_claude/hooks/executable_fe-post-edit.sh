#!/bin/bash

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // ""')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

[[ -z "$file_path" ]] && exit 0

# Only process FE source files
[[ "$file_path" =~ \.(ts|tsx|js|jsx|css|json)$ ]] || exit 0
# Skip node_modules and build output
[[ "$file_path" =~ (node_modules|\.next|dist|build)/ ]] && exit 0

# Walk up from file to find package.json (project root)
project_root=""
dir="$(dirname "$file_path")"
while [[ "$dir" != "/" ]]; do
  if [[ -f "$dir/package.json" ]]; then
    project_root="$dir"
    break
  fi
  dir="$(dirname "$dir")"
done

[[ -z "$project_root" ]] && exit 0

# Format: biome first, prettier fallback
if [[ -f "$project_root/biome.json" ]] || [[ -f "$project_root/biome.jsonc" ]]; then
  (cd "$project_root" && npx biome check --write "$file_path" 2>/dev/null) || true
elif [[ -f "$project_root/.prettierrc" ]] || [[ -f "$project_root/.prettierrc.js" ]] || \
     [[ -f "$project_root/.prettierrc.json" ]] || [[ -f "$project_root/.prettierrc.yaml" ]] || \
     [[ -f "$project_root/.prettierrc.cjs" ]] || \
     (command -v jq &>/dev/null && jq -e '.prettier' "$project_root/package.json" &>/dev/null); then
  (cd "$project_root" && npx prettier --write "$file_path" 2>/dev/null) || true
fi

# Type check: non-blocking, surface errors to Claude as informational output
tsconfig=""
if [[ -f "$project_root/tsconfig.json" ]]; then
  tsconfig="$project_root/tsconfig.json"
fi

if [[ -n "$tsconfig" ]] && [[ "$file_path" =~ \.(ts|tsx)$ ]]; then
  tsc_output=$(cd "$project_root" && timeout 30 npx tsc --noEmit -p "$tsconfig" 2>&1) || {
    echo "TypeScript errors detected:"
    echo "$tsc_output"
  }
fi

exit 0
