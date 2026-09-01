#!/bin/sh
# Dev server check: is something listening on common dev ports, and does
# the process belong to THIS project (cwd under project_dir)? Guards the
# known trap of trusting a foreign app on :3000. Hidden when nothing
# listens. Cached 15s (lsof on every render would be too hot).
proj=$(jq -r '.workspace.project_dir // .cwd // empty')
[ -z "$proj" ] && exit 0
cache="${TMPDIR:-/tmp}/ccstatusline-devserver-$(printf '%s' "$proj" | cksum | cut -d' ' -f1)"
ttl=15
now=$(date +%s)
if [ -f "$cache" ] && [ $(( now - $(stat -f %m "$cache") )) -lt "$ttl" ]; then
    cat "$cache"
    exit 0
fi
: > "$cache"
for port in 3000 5173 4200 8080; do
    pid=$(lsof -n -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -1)
    [ -z "$pid" ] && continue
    pcwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
    case "$pcwd" in
        "$proj"*)
            # ours: teal server icon + port
            printf '\033[38;2;0;232;198m\363\260\222\213 :%s\033[0m' "$port" > "$cache"
            break
            ;;
        *)
            # something else squats the port: peach warning
            printf '\033[38;2;238;93;67m\363\260\222\213 :%s ciz\303\255!\033[0m' "$port" > "$cache"
            ;;
    esac
done
cat "$cache"
