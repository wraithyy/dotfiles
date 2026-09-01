#!/bin/bash
# Log top CPU consumers whenever total CPU usage crosses a threshold.
# TSV: ts, total_busy%, pid, cpu%, command (full path, resolved via ps —
# top truncates its COMMAND column to ~16 chars under launchd).
set -u

THRESHOLD="${CPU_HOG_THRESHOLD:-80}"
TOPN="${CPU_HOG_TOPN:-8}"
LOGDIR="${CPU_HOG_LOGDIR:-$HOME/.local/state/cpu-hogs}"

parse() {
  awk -v thr="$THRESHOLD" -v ts="$(date +%Y-%m-%dT%H:%M:%S)" '
    /^CPU usage:/ { idle=$0; sub(/.*, */,"",idle); sub(/% *idle.*/,"",idle); busy=100-idle }
    /^ *PID/ { n=0; next }
    $1 ~ /^[0-9]+$/ { pid[++n]=$1; cpu[n]=$2 }
    END {
      if (busy < thr) exit 0
      for (i=1; i<=n; i++) printf "%s\t%.1f\t%s\t%s\n", ts, busy, pid[i], cpu[i]
    }'
}

# stdin: parse output; adds full command name per pid
resolve() {
  rows=$(cat)
  [ -n "$rows" ] || return 0
  pids=$(echo "$rows" | cut -f3 | paste -sd, -)
  ps -p "$pids" -o pid=,command= 2>/dev/null | sed 's/^ *//' > "$TMP"
  awk -F'\t' -v names="$TMP" '
    BEGIN { while ((getline line < names) > 0) {
              p=line; sub(/ .*/,"",p); c=line; sub(/^[0-9]+ */,"",c); cmd[p]=c } }
    { print $0 "\t" (($3 in cmd) ? cmd[$3] : "?") }' <<< "$rows"
}

if [ "${1:-}" = "--selftest" ]; then
  out=$(printf '%s\n' \
    'CPU usage: 14.28% user, 7.14% sys, 78.57% idle' \
    'PID    %CPU' \
    '123    91.4' \
    '456    3.2' | THRESHOLD=20 parse)
  [ "$(echo "$out" | head -1)" = "$(printf '%s\t21.4\t123\t91.4' "$(echo "$out" | cut -f1 | head -1)")" ] \
    || { echo "FAIL: $out"; exit 1; }
  echo "ok"; exit 0
fi

TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT
mkdir -p "$LOGDIR"
top -l 2 -n "$TOPN" -o cpu -stats pid,cpu -s 1 2>/dev/null \
  | parse | resolve >> "$LOGDIR/$(date +%Y-%m-%d).tsv"
find "$LOGDIR" -name '*.tsv' -mtime +14 -delete 2>/dev/null || true
