#!/bin/sh
# Persistent WoW-style XP / leveling across all Claude Code sessions.
# XP: token throughput + changed lines (deltas per session_id, so parallel
# sessions don't double-count). Rested bonus (x2, blue bar) accrues after
# 2h+ away. Level 80 -> prestige star, back to Lv.1. DING! flash for 30s.
# State lives outside chezmoi (mutable data): ~/.local/state/ccstatusline/
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/ccstatusline"
STATE="$STATE_DIR/xp.json"
mkdir -p "$STATE_DIR"
# init on missing OR corrupt state (a torn concurrent write must not kill the widget)
jq -e . "$STATE" >/dev/null 2>&1 \
    || printf '{"xp":0,"level":1,"prestige":0,"rested":0,"last_ts":0,"ding_until":0,"sessions":{}}' > "$STATE"
now=$(date +%s)

out=$(jq -c --slurpfile stf "$STATE" --argjson now "$now" '
  # ~1-2 dingy denne zkraje, tydny na level pozdeji (l1=400, l10=9k, l40=58k)
  def need($l): (400 * pow($l; 1.35)) | floor;
  ($stf[0]) as $s
  | (.session_id // "unknown") as $sid
  # output only: total_input_tokens is inflated by cache reads re-reading
  # the whole context every turn, that is not "earned" work
  | (.context_window.total_output_tokens // 0) as $tok
  | (((.cost.total_lines_added // 0) + (.cost.total_lines_removed // 0))) as $lines
  | ($s.sessions[$sid] // {"tok":0,"lines":0}) as $base
  | ([$tok - $base.tok, 0] | max) as $dtok
  | ([$lines - $base.lines, 0] | max) as $dlines
  | (($dtok / 100) + ($dlines * 2)) as $gain0
  # rested pool accrues 150 xp/h after 2h+ gap, capped at 3000
  | (if $s.last_ts > 0 and ($now - $s.last_ts) > 7200
     then ([$s.rested + (($now - $s.last_ts) / 3600 * 150), 3000] | min)
     else $s.rested end) as $pool0
  | ([$gain0, $pool0] | min) as $bonus
  | ($gain0 + $bonus) as $gain
  | ($pool0 - $bonus) as $pool
  # level-ups
  | ([$s.level, $s.xp + $gain] | until(.[1] < need(.[0]); [.[0] + 1, .[1] - need(.[0])])) as $lu
  | ($lu[0] > $s.level) as $dinged
  # prestige at 81
  | (if $lu[0] > 80 then {level: 1, prestige: ($s.prestige + 1)} else {level: $lu[0], prestige: $s.prestige} end) as $pr
  | (if $dinged then ($now + 30) else $s.ding_until end) as $ding
  | ($s.sessions + {($sid): {"tok": $tok, "lines": $lines, "ts": $now}}
     | with_entries(select(.value.ts // 0 > $now - 172800))) as $sess
  | {state: {xp: $lu[1], level: $pr.level, prestige: $pr.prestige, rested: $pool, last_ts: $now, ding_until: $ding, sessions: $sess},
     view: {level: $pr.level, prestige: $pr.prestige,
            pct: (($lu[1] / need($pr.level) * 100) | floor),
            rested: ($pool > 0), ding: ($ding > $now)}}
')
[ -z "$out" ] && exit 0
# atomic write: concurrent statusline renders (multiple sessions) race on
# this file; rename can lose an update but never corrupts
# ponytail: last-writer-wins, flock if lost XP ever actually matters
tmp="$STATE.$$"
printf '%s' "$out" | jq -c '.state' > "$tmp" && mv "$tmp" "$STATE"

level=$(printf '%s' "$out" | jq -r '.view.level')
prestige=$(printf '%s' "$out" | jq -r '.view.prestige')
pct=$(printf '%s' "$out" | jq -r '.view.pct')
rested=$(printf '%s' "$out" | jq -r '.view.rested')
ding=$(printf '%s' "$out" | jq -r '.view.ding')

star=''
[ "$prestige" -gt 0 ] && star=$(printf '\033[38;2;255;230;109m\342\230\205%s\033[0m' "$prestige")

if [ "$ding" = "true" ]; then
    # gold DING! flash, blinks via epoch parity
    if [ $(( now % 2 )) -eq 0 ]; then c='255;230;109'; else c='255;180;60'; fi
    printf '\033[1;38;2;%sm\342\234\246 DING! Lv.%s \342\234\246\033[0m%s' "$c" "$level" "$star"
    exit 0
fi

# bar: 8 cells, epic purple; rested = rare blue
W=8
fill=$(( pct * W / 100 )); [ "$fill" -gt "$W" ] && fill=$W
if [ "$rested" = "true" ]; then bc='0;112;221'; else bc='163;53;238'; fi
printf '%s\033[38;2;154;154;160mLv.%s \033[38;2;%sm' "$star" "$level" "$bc"
i=0; while [ "$i" -lt "$fill" ]; do printf '\342\226\260'; i=$((i+1)); done
printf '\033[38;2;80;80;86m'
while [ "$i" -lt "$W" ]; do printf '\342\226\261'; i=$((i+1)); done
printf ' \033[38;2;154;154;160m%s%%\033[0m' "$pct"
