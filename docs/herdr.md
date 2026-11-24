# Herdr setup: the halo layout

How to get the same [Herdr](https://herdr.dev) desktop setup on another machine: the
`halo` layout (spaces/agents tree, agent dashboard, usage), its Claude Code reporter,
the dialogs (new space, new task, quick reply, scripts), and the companion mods.

Everything here lives in this repo under `dot_config/herdr-app/` (deployed to
`~/.config/herdr-app/`) plus a few entries in `dot_claude/settings.json.tmpl`.

## What you get

| Piece | Where | What it does |
|---|---|---|
| `layouts/halo.json` | layout | Catppuccin Mocha + teal, blurred translucent window, own traffic lights |
| `mods/halo` | sidebar, tab bar, dock | Spaces as cards with their agents (goal, status, context %, cache TTL, subagents), 5h/7d usage; tab bar with agent-tab / sidebar / dock toggles; agent dock (auto on a focused agent) with BRIEF, CONTEXT, ACTIVITY, CACHE, CHANGES; separate dev dock (server button, works without Claude) with SERVERS and OTHER APPS; dev server ports per space in the tree |
| `mods/halo-reporter` | Claude Code hooks + statusline | Parses the session transcript incrementally and publishes `halo.*` labels on the herdr terminal (`hc label`). Local only, no network |
| `mods/halo-space` | popup | New space from waypoints, git repos under `~/Development`, worktrees, or a typed path |
| `mods/halo-task` | dialog | Task name + prompt -> git worktree `task/<slug>` -> new space with Claude running the prompt |
| `mods/halo-reply` | dialog | Every agent waiting on you, its screen tail, an input; Enter replies, a digit picks a permission option |
| `mods/halo-scripts` | popup | package.json / Makefile / justfile scripts of the focused folder, run in a split |
| `themes/catppuccin-mocha.json` | theme | Used by the layout |
| `mods/waypoint`, `mods/openr` | symlinks | Separate repos: saved folders, and openable paths/URLs from a terminal |
| Claude mods `where-am-i`, `hud` | `dot_claude/mods` | The goal / doing / waiting / next summary (shown in halo's BRIEF), and a one-row mode-toggle band in Claude Code |

## Requirements

- macOS (Apple Silicon) with the Herdr app (`herdr-app`) and herdr-core (`hc`), both on `PATH`
- Claude Code
- `python3` (stdlib only), `git`
- Fonts: JetBrainsMono Nerd Font (`brew install --cask font-jetbrains-mono-nerd-font`); Geist ships with Herdr
- Optional: `lazygit`, `yazi`, `just`, `bun` (only to run the mod tests)

## Option A: the whole dotfiles repo

```sh
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply wraithyy
```

Then clone the two companion mods to where the symlinks point:

```sh
git clone https://github.com/wraithyy/herdr-waypoint ~/Development/herdr-waypoint
git clone https://github.com/wraithyy/herdr-openr ~/Development/herdr-openr
chezmoi apply
```

The Claude Code statusline in this repo is wrapped by [collie](https://github.com/wraithyy/collie)
(`collie beacon statusline <base64>`). Without collie installed the statusline prints
nothing: either install collie, or use the plain statusline from Option B step 4.

Start Herdr and switch: `herdr-app do layout.switch '{"name":"halo"}'` (or `ctrl-shift-l`).

## Option B: only the Herdr part

1. Copy the Herdr files from this repo into `~/.config/herdr-app/`:

   ```sh
   SRC=<path to a clone of this repo>/dot_config/herdr-app
   DST=~/.config/herdr-app
   mkdir -p $DST/layouts $DST/mods $DST/themes
   cp $SRC/layouts/halo.json $DST/layouts/
   cp $SRC/themes/catppuccin-mocha.json $DST/themes/
   cp -R $SRC/mods/halo $SRC/mods/halo-reporter $SRC/mods/halo-space \
         $SRC/mods/halo-task $SRC/mods/halo-reply $SRC/mods/halo-scripts $DST/mods/
   ```

   Herdr never overwrites these; never copy over `AGENTS.md` or the `.d.ts` files (Herdr writes them).

2. Keys: merge the `layout:halo` section of `dot_config/herdr-app/keys.json` into your
   `~/.config/herdr-app/keys.json`. It binds alt-hjkl / alt-arrows (pane navigation and
   resize, forwarded into nvim splits) and the dialogs:

   | Key | Action |
   |---|---|
   | `cmd-shift-t` | new task (worktree + Claude) |
   | `cmd-shift-j` | reply to waiting agents |
   | `cmd-shift-r` | run a repo script |
   | `cmd-shift-n` | waypoints (`ctrl+s` saves the focused folder, `ctrl+r` renames) |

   Keep alt-arrows out of the `terminal` section: it outranks `layout:*` sections.

3. Claude Code hooks: add to `~/.claude/settings.json` (merge with your existing hooks).
   They are async and exit at once outside Herdr (no `HC_TERMINAL_ID`):

   ```json
   {
     "hooks": {
       "SessionStart":     [{ "hooks": [{ "type": "command", "async": true, "timeout": 10, "command": "[ -n \"$HC_TERMINAL_ID\" ] && python3 -I \"$HOME/.config/herdr-app/mods/halo-reporter/report.py\" hook || true" }] }],
       "UserPromptSubmit": [{ "hooks": [{ "type": "command", "async": true, "timeout": 10, "command": "[ -n \"$HC_TERMINAL_ID\" ] && python3 -I \"$HOME/.config/herdr-app/mods/halo-reporter/report.py\" hook || true" }] }],
       "PostToolUse":      [{ "hooks": [{ "type": "command", "async": true, "timeout": 10, "command": "[ -n \"$HC_TERMINAL_ID\" ] && python3 -I \"$HOME/.config/herdr-app/mods/halo-reporter/report.py\" hook || true" }] }],
       "Stop":             [{ "hooks": [{ "type": "command", "async": true, "timeout": 10, "command": "[ -n \"$HC_TERMINAL_ID\" ] && python3 -I \"$HOME/.config/herdr-app/mods/halo-reporter/report.py\" hook || true" }] }],
       "SubagentStop":     [{ "hooks": [{ "type": "command", "async": true, "timeout": 10, "command": "[ -n \"$HC_TERMINAL_ID\" ] && python3 -I \"$HOME/.config/herdr-app/mods/halo-reporter/report.py\" hook || true" }] }],
       "PostCompact":      [{ "hooks": [{ "type": "command", "async": true, "timeout": 10, "command": "[ -n \"$HC_TERMINAL_ID\" ] && python3 -I \"$HOME/.config/herdr-app/mods/halo-reporter/report.py\" hook || true" }] }]
     }
   }
   ```

4. Statusline: halo's cache TTL, exact context total and the 5h/7d usage come from
   Claude Code's statusline JSON. Your statusline command must hand that JSON to the
   reporter. Plain version (no collie), keeping `ccstatusline` as the visible output:

   ```json
   "statusLine": {
     "type": "command",
     "padding": 0,
     "command": "t=$(mktemp \"${TMPDIR:-/tmp}/ccsl.XXXXXX\") && tee \"$t\" | ccstatusline; [ -n \"${HC_TERMINAL_ID:-}\" ] && cp \"$t\" \"$t.halo\" && (python3 -I \"$HOME/.config/herdr-app/mods/halo-reporter/report.py\" statusline \"$t.halo\" >/dev/null 2>&1 &); rm -f \"$t\""
   }
   ```

   With your own statusline script, add the same `cp` + background `report.py statusline` part.

5. Optional, the BRIEF summary and the compact Claude band: copy `dot_claude/mods/where-am-i`
   and `dot_claude/mods/hud` to `~/.claude/mods/` and list them in the `CLAUDE_CODE_PLUGIN_DIRS`
   env var of `~/.claude/settings.json` (colon-separated paths). Without `where-am-i`, BRIEF
   falls back to the session name and the agent's current message (marked AUTO).

6. Companion mods (optional): clone `herdr-waypoint` and `herdr-openr` and copy (or symlink)
   their `herdr-app-mod/mods/<name>` folders into `~/.config/herdr-app/mods/`.

## Verify

```sh
for m in halo halo-space halo-task halo-reply halo-scripts; do herdr-app check ~/.config/herdr-app/mods/$m; done
herdr-app do layout.switch '{"name":"halo"}'
herdr-app status            # "errors": [] expected
python3 -I ~/.config/herdr-app/mods/halo-reporter/test_report.py
```

Then start Claude in a Herdr tab and send one prompt. `hc get <terminal> --json` should
list `halo.status`, `halo.context`, `halo.activity`, `halo.cache` (and `halo.where` with
where-am-i) under `labels`, and the dock appears when you focus that agent.

## Troubleshooting

- **Agent dock never appears**: it only shows for a focused agent and when the dock
  button (rightmost in the tab bar) is on. The dev dock has its own server button.
- **No TTL / usage**: the statusline step is missing, or the statusline prints nothing
  (collie wrapper without collie). `hc get <t> --json | grep halo.status`.
- **BRIEF says AUTO**: where-am-i isn't loaded in that Claude session (mods load at session start).
- **No ports under a space**: servers are attributed by walking the process tree up to
  the shell of a herdr terminal (`lsof` + `ps`, every 10 s). Ports 49152+ are ignored.
  OTHER APPS lists dev ports (3000, 5173, 8080, ...) answered by something not started
  from Herdr: a check against such a port may be talking to the wrong app.
- **Context split looks off**: categories are estimates (chars / 3.5) scaled to the exact
  total; the total is exact.
- **Escape hatch**: `ctrl-alt-shift-escape` resets to Herdr's default layout and keys.

## Privacy

The reporter reads only the local transcript and statusline JSON and writes terminal
labels and `~/.cache/halo/`. Usage comes from Claude Code's own statusline data; nothing
reads credentials or calls an API.
