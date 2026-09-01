#!/bin/bash
# Route NEW Teams windows (meeting pop-outs) to their rule workspace (chat).
# OmniWM app rules only place an app's first window; extra windows open on the
# active workspace. Invoked by `omniwmctl watch windows-changed --exec` on every
# window-set change: applies rules to Teams windows not seen before, so a
# window the user later moves away by hand is never yanked back.
CTL="/Applications/OmniWM.app/Contents/MacOS/omniwmctl"
SEEN="/tmp/omniwm-teams-router-seen"
touch "$SEEN"

"$CTL" query windows --bundle-id com.microsoft.teams2 2>/dev/null |
	jq -r '.result.payload.windows[].id' |
	while read -r id; do
		grep -qxF "$id" "$SEEN" && continue
		"$CTL" rule apply --window "$id" >/dev/null 2>&1
		echo "$id" >>"$SEEN"
	done
