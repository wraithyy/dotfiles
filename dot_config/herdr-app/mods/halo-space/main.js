// New space picker (popup, mod.open:halo-space): waypoints and git repos under
// ~/Development and the worktrees folder, fuzzy-filtered; a typed path works too.
// Enter opens the folder as a new space. Replaces the system folder dialog.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { exec, readTextFile, run, theme, props, closeOverlay, appHome, home } from "herdr";
import { merge, parseWaypoints, typedPath, score } from "./rank.js";

const MONO = "JetBrainsMono Nerd Font Mono";
const SHOWN = 12;
const SCAN_DEPTH = "4";

async function repos(roots) {
  const r = await exec("find", [...roots, "-maxdepth", SCAN_DEPTH, "-name", ".git", "-prune"], { timeout: 5000 }).catch(() => null);
  return (r?.stdout ?? "").split("\n").filter(Boolean).map((p) => p.replace(/\/\.git$/, "")).sort();
}

export default class HaloSpace extends View {
  init(_props, cx) {
    this.home = home();
    this.items = [];
    this.at = 0;
    this.status = "scanning…";
    this.input = InputState.new({ placeholder: "Folder for a new space… (or type ~/path)" });
    this.input.on("change", (_e, cx) => { this.at = 0; cx.notify(); });
    this.input.on("submit", () => this.open(this.rows()[this.at]));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
    cx.spawn(async (cx) => {
      const [wpText, found] = await Promise.all([
        readTextFile(`${appHome()}/data/waypoint/waypoints.tsv`).catch(() => null),
        repos([`${this.home}/Development`, `${this.home}/.herdr/worktrees`]),
      ]);
      this.items = merge(parseWaypoints(wpText), found, this.home);
      this.status = this.items.length ? "" : "No waypoints or repos found; type a path";
      cx.notify();
    });
  }

  rows() {
    const q = this.input.value().trim();
    const typed = typedPath(q, this.home);
    const list = q && !typed
      ? this.items.map((it, i) => ({ it, i, s: score(it, q) })).filter((x) => x.s !== null)
        .sort((a, b) => a.s - b.s || a.i - b.i).map((x) => x.it)
      : this.items;
    return typed ? [{ kind: "path", name: typed.split("/").pop() || typed, path: typed, label: q }, ...list] : list;
  }

  close() { closeOverlay(props().overlay); }

  open(item) {
    if (!item) return;
    this.close();
    // A waypoint keeps its saved name; other folders get Herdr's automatic name.
    run("space.new", { folder: item.path, ...(item.kind === "waypoint" ? { name: item.name } : {}) });
  }

  render() {
    const t = theme();
    const rows = this.rows();
    const start = Math.max(0, Math.min(this.at - SHOWN + 1, rows.length - SHOWN));
    const shown = rows.slice(start, start + SHOWN);
    const ICON = { waypoint: ["mods/halo/icons/waypoint.svg", t.accent], repo: ["mods/workspace-chrome/git-branch.svg", t.muted], path: ["mods/workspace-chrome/folder.svg", t.ansi3] };
    const row = (it, i) => {
      const sel = start + i === this.at;
      const [icon, color] = ICON[it.kind];
      return h_flex().id(`sp-${start + i}`).h(32).px(10).gap(10).items_center().rounded(6).cursor_pointer()
        .when(sel, (el) => el.bg(t.selected))
        .hover((s) => s.bg(t.hover))
        .on_click(() => this.open(it))
        .child(svg(icon).size(13).flex_none().text_color(color))
        .child(div().flex_none().text_size(13).font_medium().text_color(sel ? t.foreground : t.muted).child(it.name))
        .child(div().flex_1().min_w(0).truncate().font_family(MONO).text_size(10.5).text_color(t.dim).child(it.label));
    };
    return v_flex().id("halo-space").track_focus(this.handle).w_full().min_h(0).p(16).gap(10).bg(t.popover)
      .on_key_down((e, cx) => {
        const k = e.key;
        const ctrl = e.modifiers.control;
        if (k === "escape") return this.close();
        if (k === "down" || (ctrl && k === "n")) this.at = Math.min(this.at + 1, rows.length - 1);
        else if (k === "up" || (ctrl && k === "p")) this.at = Math.max(this.at - 1, 0);
        else return;
        cx.stop_propagation();
        cx.notify();
      })
      .child(h_flex().gap(8).items_center()
        .child(div().w(2).h(12).bg(t.accent))
        .child(div().font_family(MONO).text_size(11).font_semibold().text_color(t.accent).child("NEW SPACE"))
        .child(div().flex_1())
        .child(div().font_family(MONO).text_size(9.5).text_color(t.dim).child("↑↓ · enter open · ~/path · esc")))
      .child(h_flex().h(36).flex_none().px(10).items_center().rounded(8).border(1).border_color(t.accent).bg(t.background)
        .child(Input.new(this.input).flex_1().h_full().text_size(13).text_color(t.foreground)))
      .child(v_flex().min_h(0).gap(2)
        .children(shown.length ? shown.map(row) : [div().px(10).py(8).text_size(12).text_color(t.dim).child(this.status || "No match")]));
  }
}
