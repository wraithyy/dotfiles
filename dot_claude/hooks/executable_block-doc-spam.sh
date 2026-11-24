#!/bin/bash
# PreToolUse Write hook: block creation of NEW .md/.txt files outside the
# whitelist. Curbs agent documentation spam; editing existing docs is fine.

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

[ -z "$file_path" ] && exit 0

# only doc-ish files
case "$file_path" in
  *.md|*.MD|*.txt) ;;
  *) exit 0 ;;
esac

# editing an existing file is always allowed
[ -e "$file_path" ] && exit 0

# whitelist: canonical docs, doc dirs, claude config (incl. chezmoi source
# dot_claude/), rules/, temp/scratch areas
case "$file_path" in
  */README*|*/CLAUDE*|*/AGENTS.md|*/CHANGELOG*|*/LICENSE*) exit 0 ;;
  */docs/*|*/plans/*|*/.claude/*|*/dot_claude/*|*/rules/*|*/memory/*) exit 0 ;;
  */[Nn]otes/*) exit 0 ;;
  /tmp/*|/private/tmp/*|*/scratchpad/*) exit 0 ;;
  */slides.md|*/slides/*) exit 0 ;;
esac

# Slidev decks are markdown by nature: allow anywhere inside a project whose
# nearest package.json depends on @slidev
dir=$(dirname "$file_path")
while [ "$dir" != "/" ] && [ "$dir" != "." ]; do
  if [ -f "$dir/package.json" ]; then
    grep -q '"@slidev/' "$dir/package.json" && exit 0
    break
  fi
  dir=$(dirname "$dir")
done

echo "Blocked: creating '$file_path' — new .md/.txt files outside docs/, plans/ or README/CLAUDE are usually unwanted. Ask the user first, or write to the scratchpad." >&2
exit 2
