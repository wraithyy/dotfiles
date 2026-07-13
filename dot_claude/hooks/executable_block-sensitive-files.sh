#!/bin/bash
# Block reading files that likely contain secrets/API keys.
# Whitelist: .env.template, .env.example, .env.sample, .env.dist

INPUT=$(cat)

# Hook payload nests tool args under tool_input (schema: tool_name / tool_input)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)

is_whitelisted() {
  local basename="$1"
  echo "$basename" | grep -qiE \
    '\.env\.(template|example|sample|dist|defaults|example\.local)$'
}

SENSITIVE_NAME_RE='^\.env$|^\.env\.|^\.envrc$|^\.netrc$|^\.npmrc$|^\.pypirc$|^id_rsa$|^id_ed25519$|^id_ecdsa$|^id_dsa$|\.pem$|\.key$|\.p12$|\.pfx$|\.jks$|^credentials$|^credentials\.(json|yaml|yml)$|^secrets\.(json|yaml|yml)$|^\.secrets$|^\.htpasswd$|^auth\.json$|^token\.json$|_rsa$|_ed25519$'

is_sensitive() {
  echo "$1" | grep -qiE "$SENSITIVE_NAME_RE"
}

is_sensitive_dir() {
  # full-path match for credential directories
  echo "$1" | grep -qE '(^|/)\.(aws|ssh|gnupg|kube)(/|$)'
}

deny() {
  # exit 2 + stderr: blocks the tool call, message is shown to Claude
  echo "Blocked: $1 may contain secrets or API keys. Ask the user to provide the value another way." >&2
  exit 2
}

check_path() {
  local path="$1"
  local basename
  basename=$(basename "$path")
  is_whitelisted "$basename" && return 0
  is_sensitive_dir "$path" && deny "'$path' (credential directory)"
  if is_sensitive "$basename"; then
    deny "'$basename'"
  fi
}

if [ -n "$FILE_PATH" ]; then
  check_path "$FILE_PATH"
fi

SENSITIVE_CMD_RE='(^|[[:space:]/])\.env($|[[:space:]]|\.[a-z])|(^|[[:space:]/])\.(envrc|netrc|htpasswd|npmrc|pypirc)([[:space:]]|$)|(^|[[:space:]/])(id_rsa|id_ed25519|id_ecdsa|id_dsa)([[:space:]]|$)|(^|[[:space:]])[^[:space:]]*/\.(aws|ssh|gnupg|kube)/|\.(pem|p12|pfx|jks)([[:space:]]|$)|(credentials|secrets)\.(json|yaml|yml)([[:space:]]|$)'

if [ -n "$COMMAND" ]; then
  if echo "$COMMAND" | grep -qE "$SENSITIVE_CMD_RE"; then
    # Allow whitelisted suffixes even in Bash commands
    if ! echo "$COMMAND" | grep -qiE '\.(template|example|sample|dist)'; then
      deny "command targets a file that"
    fi
  fi
fi

exit 0
