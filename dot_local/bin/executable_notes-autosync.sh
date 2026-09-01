#!/bin/bash
# Autosync for the Notes vault (replaces obsidian-git). Run by launchd every 30 min.
# Two rules exist to stop 1Password TouchID prompts firing every 30 min from a
# headless launchd job (2026-08-05):
#   - commit.gpgsign=false: signing an autosync commit calls op-ssh-sign, which
#     wakes 1Password for an unlock prompt. Autosync commits need no signature.
#   - clean tree => exit before touching the network: fetch/push over SSH goes
#     through the 1Password SSH agent, another prompt when the vault is locked.
#     Nothing changed locally means nothing to sync; run this script by hand to
#     pull remote edits on demand.
set -e
cd "$HOME/Development/Notes"

[ -n "$(git status --porcelain)" ] || exit 0

git add -A
git -c commit.gpgsign=false commit -m "autosync"
git pull --rebase --quiet
git push --quiet
