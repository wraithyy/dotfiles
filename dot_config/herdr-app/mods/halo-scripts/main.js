// Script palette (popup opened with mod.open:halo-scripts): package.json scripts, Makefile targets and
// justfile recipes of a folder. Enter runs the pick in a split below, in a login shell
// that stays open after the script ends so its output can be read.

import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { View, div } from "gpui-kit";
import { exec, readTextFile, run, props, closeOverlay, focused, spaces, theme } from "herdr";
import { parseMakefile, parseJustfile, fuzzy } from "./parse.js";

const MONO = "JetBrainsMono Nerd Font Mono";

const LOCKS = [["pnpm-lock.yaml", "pnpm"], ["bun.lockb", "bun"], ["bun.lock", "bun"], ["yarn.lock", "yarn"], ["package-lock.json", "npm"]];
const SHOWN = 12;


async function collect(folder) {
  const ls = await exec("ls", ["-1A", folder]).catch(() => ({ stdout: "" }));
  const files = new Set(ls.stdout.split("\n"));
  const items = [];
  if (files.has("package.json")) {
    const pm = LOCKS.find(([lock]) => files.has(lock))?.[1] ?? "npm";
    let scripts = {};
    try { scripts = JSON.parse((await readTextFile(`${folder}/package.json`)) ?? "{}").scripts ?? {}; } catch { scripts = {}; }
    for (const [name, body] of Object.entries(scripts)) items.push({ source: pm, name, detail: String(body), argv: [pm, "run", name] });
  }
  const make = ["Makefile", "makefile", "GNUmakefile"].find((f) => files.has(f));
  if (make) {
    for (const name of parseMakefile(await readTextFile(`${folder}/${make}`))) items.push({ source: "make", name, detail: make, argv: ["make", name] });
  }
  const just = ["justfile", "Justfile", ".justfile"].find((f) => files.has(f));
  if (just) {
    for (const name of parseJustfile(await readTextFile(`${folder}/${just}`))) items.push({ source: "just", name, detail: just, argv: ["just", name] });
  }
  return items;
}

export class ScriptsState {
  constructor(cx, onChange) {
    this.folder = focused()?.cwd ?? spaces().find((sp) => sp.active)?.folder;
    this.items = [];
    this.status = "reading…";
    this.at = 0;
    this.input = InputState.new({ placeholder: "Run a script…" });
    this.input.on("change", (_e, cx) => { this.at = 0; cx.notify(); });
    this.input.on("submit", () => this.runPick(this.rows()[this.at]));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
    cx.spawn(async (cx) => {
      this.items = this.folder ? await collect(this.folder) : [];
      this.status = this.items.length ? "" : "No package.json scripts, Makefile or justfile here";
      onChange?.();
      cx.notify();
    });
  }

  rows() {
    const q = this.input.value().trim();
    return q ? this.items.filter((it) => fuzzy(`${it.source} ${it.name}`, q)) : this.items;
  }

  close() { closeOverlay(props().overlay); }

  runPick(item) {
    if (!item) return;
    this.close();
    // A login shell runs the script and stays, so the output survives the script ending.
    // Folder and command go in as positional arguments, never spliced into the script:
    // a package.json script name is arbitrary text.
    run("pane.split", { direction: "down", argv: ["/bin/zsh", "-lc", 'cd "$1" && shift && "$@"; exec /bin/zsh -l', "zsh", this.folder, ...item.argv] });
  }
}

const SOURCE_COLOR = { pnpm: "ansi3", npm: "ansi1", yarn: "ansi4", bun: "ansi5", make: "ansi2", just: "ansi6" };

export function renderScripts(state, t) {
  const rows = state.rows();
  const start = Math.max(0, Math.min(state.at - SHOWN + 1, rows.length - SHOWN));
  const shown = rows.slice(start, start + SHOWN);
  const row = (it, i) => {
    const sel = start + i === state.at;
    return h_flex().id(`script-${start + i}`).h(30).px(10).gap(10).items_center().rounded(6).cursor_pointer()
      .when(sel, (el) => el.bg(t.selected))
      .hover((s) => s.bg(t.hover))
      .on_click(() => state.runPick(it))
      .child(div().w(42).flex_none().font_family(MONO).text_size(10).text_color(t[SOURCE_COLOR[it.source]] ?? t.muted).child(it.source.toUpperCase()))
      .child(div().flex_none().text_size(13).text_color(sel ? t.foreground : t.muted).font_medium().child(it.name))
      .child(div().flex_1().min_w(0).truncate().font_family(MONO).text_size(10.5).text_color(t.dim).child(it.detail));
  };
  return v_flex().id("scripts").track_focus(state.handle).w_full().min_h(0).p(16).gap(10).bg(t.popover)
    .on_key_down((e, cx) => {
      const k = e.key;
      const ctrl = e.modifiers.control;
      if (k === "escape") return state.close();
      if (k === "down" || (ctrl && k === "n")) state.at = Math.min(state.at + 1, rows.length - 1);
      else if (k === "up" || (ctrl && k === "p")) state.at = Math.max(state.at - 1, 0);
      else return;
      cx.stop_propagation();
      cx.notify();
    })
    .child(h_flex().gap(8).items_center()
      .child(div().w(2).h(12).bg(t.accent))
      .child(div().font_family(MONO).text_size(11).font_semibold().text_color(t.accent).child("RUN SCRIPT"))
      .child(div().flex_1().min_w(0).truncate().font_family(MONO).text_size(10).text_color(t.dim).child(state.folder ?? ""))
      .child(div().font_family(MONO).text_size(9.5).text_color(t.dim).child("↑↓ · enter run in split · esc")))
    .child(h_flex().h(36).flex_none().px(10).items_center().rounded(8).border(1).border_color(t.accent).bg(t.background)
      .child(Input.new(state.input).flex_1().h_full().text_size(13).text_color(t.foreground)))
    .child(v_flex().min_h(0).gap(2)
      .children(shown.length ? shown.map(row) : [div().px(10).py(8).text_size(12).text_color(t.dim).child(state.status || "No match")]));
}

export default class HaloScripts extends View {
  init(_props, cx) {
    this.state = new ScriptsState(cx);
  }

  render() {
    return renderScripts(this.state, theme());
  }
}
