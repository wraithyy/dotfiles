# Herdr setup

The `halo` layout and its mods now live in their own repo,
[wraithyy/herdr-halo](https://github.com/wraithyy/herdr-halo): install guide, keys, Claude
Code hooks and statusline are in its README. This repo links it in with chezmoi symlinks
(`dot_config/herdr-app/layouts/symlink_halo.json.tmpl`, `dot_config/herdr-app/mods/symlink_halo*.tmpl`)
and carries the hooks and statusline in `dot_claude/settings.json.tmpl`.

## On a new machine

```sh
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply wraithyy
git clone https://github.com/wraithyy/herdr-halo ~/Development/herdr-halo
git clone https://github.com/wraithyy/herdr-waypoint ~/Development/herdr-waypoint
git clone https://github.com/wraithyy/herdr-openr ~/Development/herdr-openr
chezmoi apply
herdr-app do layout.switch '{"name":"halo"}'
```

The statusline here is wrapped by [collie](https://github.com/wraithyy/collie)
(`collie beacon statusline <base64>`); without collie installed it prints nothing. Install
collie or use the plain statusline from the herdr-halo README.

Also in this repo: the `valley` layout and its mods, and the Claude Code mods
`where-am-i` (feeds halo's BRIEF) and `hud` (one-row mode band) under `dot_claude/mods`.

## Editing halo

Edit in `~/Development/herdr-halo`; mods reload live through the symlinks. After editing
the layout, `touch -h ~/.config/herdr-app/layouts/halo.json` so Herdr notices.
