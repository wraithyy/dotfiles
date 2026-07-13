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
