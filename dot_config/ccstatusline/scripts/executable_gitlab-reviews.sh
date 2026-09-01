#!/bin/sh
# MRs waiting for my review on Trask GitLab. Hidden when zero, unauthed,
# or offline. Uses glab's own stored token (no `op read` -> no TouchID
# prompts from the statusline). One-time setup:
#   glab auth login --hostname gitlab.trask.cz
# Cached 5 min; network never runs on the render path more often.
HOST=gitlab.trask.cz
cache="${TMPDIR:-/tmp}/ccstatusline-gitlab-reviews"
ttl=300
now=$(date +%s)
if [ -f "$cache" ] && [ $(( now - $(stat -f %m "$cache") )) -lt "$ttl" ]; then
    cat "$cache"
    exit 0
fi
# refresh cache first so a hanging API call can't stall repeated renders
: > "$cache"
me=$(GITLAB_HOST=$HOST glab api user 2>/dev/null | jq -r '.username // empty')
[ -n "$me" ] && n=$(GITLAB_HOST=$HOST glab api "merge_requests?scope=all&state=opened&reviewer_username=$me&per_page=100" 2>/dev/null \
    | jq -r 'length' 2>/dev/null)
case "$n" in
    ''|0|null) ;;
    *) printf '\357\212\226 %s MR' "$n" > "$cache" ;;
esac
cat "$cache"
