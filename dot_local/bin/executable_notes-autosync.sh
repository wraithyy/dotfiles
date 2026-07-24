#!/bin/bash
# Autosync for the Notes vault (replaces obsidian-git). Run by launchd every 30 min.
set -e
cd "$HOME/Development/Notes"

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "autosync"
fi
git pull --rebase --quiet
git push --quiet
