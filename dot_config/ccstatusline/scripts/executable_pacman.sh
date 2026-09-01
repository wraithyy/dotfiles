#!/bin/sh
# Context as pacman: dots = remaining context, ghost closes in as it fills.
# stdin: Claude Code status JSON (context_window.used_percentage)
pct=$(jq -r '.context_window.used_percentage // 0')
pct=${pct%%.*}
W=10
eaten=$(( pct * W / 100 ))
[ "$eaten" -gt "$W" ] && eaten=$W
printf '\033[1;38;2;255;230;109m\341\227\247\033[38;2;128;128;133m'
i=$eaten; while [ "$i" -lt "$W" ]; do printf '\302\267'; i=$((i+1)); done
printf '\033[38;2;238;93;67m\341\227\243\033[0m'
