#!/bin/bash
# Block reading files that likely contain secrets/API keys.
# Whitelist: .env.template, .env.example, .env.sample, .env.dist

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null)

is_whitelisted() {
  local basename="$1"
  echo "$basename" | grep -qiE \
    '\.env\.(template|example|sample|dist|defaults|example\.local)$'
}

is_sensitive() {
  local basename="$1"
  echo "$basename" | grep -qiE \
    '^\.env$|^\.env\.|^\.envrc$|\
^\.netrc$|^\.npmrc$|^\.pypirc$|\
^id_rsa$|^id_ed25519$|^id_ecdsa$|^id_dsa$|\
.*\.pem$|.*\.key$|.*\.p12$|.*\.pfx$|.*\.jks$|\
^credentials$|^credentials\.(json|yaml|yml)$|\
^secrets\.(json|yaml|yml)$|^\.secrets$|\
^\.htpasswd$|^auth\.json$|^token\.json$|\
^.*_rsa$|^.*_ed25519$'
}

check_path() {
  local path="$1"
  local basename
  basename=$(basename "$path")
  is_whitelisted "$basename" && return 0
  if is_sensitive "$basename"; then
    echo "{\"decision\":\"block\",\"reason\":\"Blocked: '$basename' may contain secrets or API keys. Access the file manually if needed.\"}"
    exit 2
  fi
}

if [ -n "$FILE_PATH" ]; then
  check_path "$FILE_PATH"
fi

if [ -n "$COMMAND" ]; then
  if echo "$COMMAND" | grep -qE \
    '(^|[[:space:]/])\.env($|[[:space:]]|\.[a-z])|\
(^|[[:space:]/])\.(envrc|netrc|htpasswd|npmrc|pypirc)([[:space:]]|$)|\
(^|[[:space:]/])(id_rsa|id_ed25519|id_ecdsa|id_dsa)([[:space:]]|$)|\
\.(pem|p12|pfx|jks)([[:space:]]|$)|\
(credentials|secrets)\.(json|yaml|yml)([[:space:]]|$)'; then
    # Allow whitelisted suffixes even in Bash commands
    if ! echo "$COMMAND" | grep -qiE '\.(template|example|sample|dist)'; then
      echo "{\"decision\":\"block\",\"reason\":\"Blocked: command targets a file that may contain secrets or API keys.\"}"
      exit 2
    fi
  fi
fi

exit 0
