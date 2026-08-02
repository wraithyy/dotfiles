#!/bin/bash
# SessionStart hook: 1Password commit-signing preflight.
# Signing failures have blocked commits at the END of sessions repeatedly
# (work staged but uncommitted, one bad recovery nuked uncommitted changes).
# Attempt a throwaway signature now, while the user is at the keyboard.
# Silent when healthy; emits a warning into context when signing is broken.

input=$(cat)
cwd=$(echo "$input" | jq -r '.cwd // ""')
[[ -z "$cwd" || ! -d "$cwd" ]] && exit 0

# Only relevant where signed commits are configured
[[ "$(git -C "$cwd" config --get commit.gpgsign)" == "true" ]] || exit 0
signer=$(git -C "$cwd" config --get gpg.ssh.program)
key=$(git -C "$cwd" config --get user.signingkey)
[[ -x "$signer" && -n "$key" ]] || exit 0

# GNU timeout absent on stock macOS; fall back to gtimeout or no limit
if command -v timeout >/dev/null 2>&1; then TO="timeout 5"
elif command -v gtimeout >/dev/null 2>&1; then TO="gtimeout 5"
else TO=""; fi

keyfile=$(mktemp)
printf '%s\n' "$key" > "$keyfile"
if printf 'preflight' | $TO "$signer" -Y sign -n git -f "$keyfile" >/dev/null 2>&1; then
  rm -f "$keyfile"
  exit 0
fi
rm -f "$keyfile"

cat <<'EOF'
WARNING: 1Password commit-signing preflight FAILED (signing agent locked or
unresponsive). Before any commit in this session: tell the user to unlock
1Password first. If a commit fails on signing, DO NOT retry blindly and NEVER
recover with `git reset --hard` or force-push — leave work staged and report.
EOF
exit 0
