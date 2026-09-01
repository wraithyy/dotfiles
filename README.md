# dotfiles

Personal dotfiles managed with [chezmoi](https://chezmoi.io). macOS (primary),
Raspberry Pi, and Windows/WSL2.

## Bootstrap a new machine

```sh
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply wraithyy
```

This clones the repo, renders templates for the current OS, and runs the
install scripts (Homebrew Brewfile on macOS, apt/dnf/pacman on Linux).

## What's inside

| Area | Path | Notes |
|---|---|---|
| Neovim | `dot_config/nvim` | lazy.nvim, blink.cmp, snacks, catppuccin; `lazy-lock.json` symlinked to source root |
| Claude Code | `dot_claude` | agents, hooks, rules, skills, MCP servers |
| tmux | `dot_config/tmux` | TPM, catppuccin, smart-splits passthrough, focus-events for nvim autoread |
| tmuxp | `dot_config/tmuxp` | session layouts: dev, notes, ops, focus, review |
| Ghostty | `dot_config/ghostty` | primary terminal; catppuccin; quick-terminal on cmd+` |
| zsh | `dot_zshrc.tmpl` | oh-my-zsh + powerlevel10k, fzf-tab |
| CPU hog logging | `dot_local/bin/cpu-hog-*` | threshold-triggered CPU sampler + HTML report — see [CPU hog logging](#cpu-hog-logging) |
| CLI tools | `Brewfile` | nvim, tmux, lazygit, delta, ripgrep, fd, fzf, gh, glab... |

## Daily workflow

```sh
chezmoi edit <file>     # edit source
chezmoi diff            # preview
chezmoi apply           # apply
```

External dependencies (oh-my-zsh, zsh plugins, p10k, TPM) are managed via
`.chezmoiexternal.toml`. Secrets are pulled at runtime from 1Password
(`op read`), never stored in the repo.

## CPU hog logging

Samples CPU every 10s via a launchd agent; when total usage crosses the
threshold (default 80%), appends the top consumers to a daily TSV. Answers
"what was eating the CPU yesterday at 14:20" after the fact.

| Piece | Path |
|---|---|
| Collector | `dot_local/bin/executable_cpu-hog-log.sh` |
| Report generator | `dot_local/bin/executable_cpu-hog-report.py` |
| launchd installer | `run_onchange_darwin-cpu-hog-log.sh.tmpl` |
| Logs | `~/.local/state/cpu-hogs/YYYY-MM-DD.tsv` (14-day retention) |
| Agent | `~/Library/LaunchAgents/com.wraithy.cpu-hog-log.plist` |

Log format, tab-separated: `timestamp, total_busy%, pid, cpu%, full command`.
Process names come from `ps`, not `top` — `top` truncates its COMMAND column
to ~16 chars when run without a tty. `pid 0` (kernel_task) logs as `?`.

### Reading the logs

```sh
cpu-hog-report.py                 # all logs -> /tmp/cpu-hog-report.html, opens in browser
cpu-hog-report.py 2026-08-29      # single day

# or plain shell
awk -F'\t' '{s[$5]+=$4} END{for(k in s) printf "%.0f\t%s\n", s[k], k}' \
  ~/.local/state/cpu-hogs/*.tsv | sort -rn | head    # biggest offenders
cut -f1,2 ~/.local/state/cpu-hogs/*.tsv | uniq | sort -k2 -rn | head   # worst spikes
```

The report has two charts: *when* (one bar per over-threshold sample, hover for
the timestamp) and *who* (top 20 processes by summed CPU%, i.e. share of blame).
Self-contained HTML, no dependencies beyond python3 stdlib.

### Tuning

Threshold and sample count live in the plist's `EnvironmentVariables`, so edit
`run_onchange_darwin-cpu-hog-log.sh.tmpl` — editing the live plist gets
overwritten on the next `chezmoi apply`.

| Env var | Default | Meaning |
|---|---|---|
| `CPU_HOG_THRESHOLD` | `80` | log only when total busy% >= this |
| `CPU_HOG_TOPN` | `8` | processes recorded per sample |
| `CPU_HOG_LOGDIR` | `~/.local/state/cpu-hogs` | log location |

Interval is the plist's `StartInterval` (seconds). Each run costs ~1s of wall
clock (`top -l 2 -s 1`) at `Nice 10` + `LowPriorityIO`.

### Ops

```sh
launchctl list | grep cpu-hog     # 2nd column = last exit code
cat /tmp/cpu-hog-log.err          # stderr
cpu-hog-log.sh --selftest         # parser check
cpu-hog-report.py --selftest      # aggregation check
CPU_HOG_THRESHOLD=1 CPU_HOG_LOGDIR=/tmp/t cpu-hog-log.sh   # force a sample

# disable
launchctl unload ~/Library/LaunchAgents/com.wraithy.cpu-hog-log.plist
```

An empty daily TSV means the threshold was never crossed — the expected state
on an idle machine.
