// Pane header for the halo layout: a HUD strip per pane. A working agent gets a slow,
// faint scanner beam and a breathing core with what it is doing and a running clock; a
// blocked one shows AWAITING INPUT; idle shows STANDBY with cache TTL. Plain terminals
// get a quiet name/folder line. Motion is native (.loop); the timer only feeds the clock.

import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, terminals, spaces, run, theme, props } from "herdr";

const MONO = "JetBrainsMono Nerd Font Mono";
const BEAM = 160;
const BEAM_ALPHA = ["03", "06", "0b", "11", "18", "1e", "18", "11", "0b", "06", "03"];

const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}\p{Ps}\p{Pi}]+/u, "").trim();
const folder = (cwd) => (cwd ?? "").replace(/^\/Users\/[^/]+/, "~");

function label(term, key) {
  try { return term?.labels?.[key] ? JSON.parse(term.labels[key]) : null; } catch { return null; }
}

function clock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default class HaloPane extends View {
  init(_props, cx) {
    this.width = 600;
    // A clock for the elapsed time, ticking only while the agent works (one redraw a
    // second); otherwise TTL is in minutes and a slow refresh is enough.
    this.tick = 0;
    cx.timer.every(1000, (cx) => {
      const st = this.me()?.status;
      this.tick += 1;
      if (st === "working" || (st && this.tick % 15 === 0)) cx.notify();
    });
  }

  me() {
    return panes().find((p) => p.pane === props()?.pane);
  }

  button(t, id, icon, command, args) {
    return div().id(id).p(3).rounded(4).text_color(t.dim)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); run(command, args); })
      .child(svg(`mods/pane/${icon}.svg`).size(13));
  }

  buttons(t, p) {
    return [
      this.button(t, `ph-r-${p.pane}`, "split-right", "pane.split", { direction: "right", pane: p.pane }),
      this.button(t, `ph-d-${p.pane}`, "split-down", "pane.split", { direction: "down", pane: p.pane }),
      this.button(t, `ph-z-${p.pane}`, p.zoomed ? "unzoom" : "zoom", "pane.zoom", { pane: p.pane }),
      this.button(t, `ph-x-${p.pane}`, "close", "pane.close", { pane: p.pane }),
    ];
  }

  // Stepped alpha slices read as a soft beam (bg takes only flat colours); .loop on
  // "left" sweeps it there and back across the strip, like a scanner.
  beam(t) {
    const slice = BEAM / BEAM_ALPHA.length;
    return h_flex().absolute().top(0).h_full().w(BEAM)
      .loop("left", { from: -BEAM, to: this.width, period: 6000, easing: "ease-in-out" })
      .children(BEAM_ALPHA.map((a) => div().w(slice).h_full().bg(`${t.accent}${a}`)));
  }

  core(t, color, period) {
    return div().relative().size(12).flex().items_center().justify_center()
      .child(div().absolute().size(12).rounded(6).border(1).border_color(color).loop("opacity", { from: 0.1, to: 0.7, period: period * 1.6 }))
      .child(div().size(6).rounded(3).bg(color).loop("opacity", { from: 0.35, to: 1, period }));
  }

  render() {
    const t = theme();
    const p = this.me();
    if (!p) return div();
    const term = p.terminal ? terminals().find((x) => x.address === p.terminal) : null;
    const st = p.status;
    const isAgent = Boolean(st);
    const name = p.name || ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const pic = p.program?.icon ? (p.program.tint ? svg(p.program.icon).size(13).text_color(t.dim) : image(p.program.icon).w(13).h(13)) : null;

    const base = h_flex().id(`hp-${p.pane}`).relative().overflow_hidden().size_full().px(10).gap(8).items_center()
      .bg(t.background).border_b(1).border_color(t.border).font_family(MONO).text_size(10.5)
      .on_size_change((size, cx) => { this.width = size.width; cx.notify(); })
      .on_hover((hovered, cx) => { this.hovered = hovered; cx.notify(); })
      .on_click(() => run("pane.focus", { pane: p.pane }));

    if (!isAgent) {
      return base
        .when(Boolean(pic), (el) => el.child(pic))
        .child(div().flex_none().max_w(240).truncate().text_color(t.muted).child(name))
        .child(div().flex_1().min_w(0).truncate().text_color(t.dim).child(folder(p.cwd)))
        .when(Boolean(p.branch), (el) => el.child(div().flex_none().text_color(t.dim).child(p.branch)))
        .when(Boolean(this.hovered), (el) => el.children(this.buttons(t, p)));
    }

    const status = label(term, "halo.status");
    const where = label(term, "halo.where");
    const tab = spaces().flatMap((s) => s.tabs ?? []).find((x) => x.id === p.tab);
    const elapsed = tab?.working_since ? clock(Date.now() - tab.working_since) : null;
    const ttlLeft = status?.exp ? status.exp * 1000 - Date.now() : null;
    const right = (el) => el
      .when(status?.ctx != null, (e) => e.child(div().flex_none().text_color(t.dim).child(`CTX ${status.ctx}%`)))
      .when(Boolean(this.hovered), (e) => e.children(this.buttons(t, p)));

    if (st === "working") {
      return right(base.bg(`${t.accent}0d`)
        .child(this.beam(t))
        .child(div().absolute().left(0).bottom(0).h(1).w_full().bg(`${t.accent}99`))
        .child(this.core(t, t.accent, 2400))
        .child(div().flex_none().font_semibold().text_color(t.accent).child("PROCESSING"))
        .child(div().flex_1().min_w(0).truncate().text_size(11.5).font_family("Geist").text_color(t.foreground)
          .child(clean(term?.report?.msg) || where?.doing || name))
        .when(Boolean(elapsed), (e) => e.child(div().flex_none().text_color(t.accent).child(elapsed))));
    }

    if (st === "blocked") {
      // Louder than working on purpose: this one needs you. A solid label, an edge bar and
      // a slow amber sweep; no blinking.
      const amber = (alpha) => `${t.blocked}${alpha}`;
      const sweep = h_flex().absolute().top(0).h_full().w(BEAM)
        .loop("left", { from: -BEAM, to: this.width, period: 4200, easing: "ease-in-out" })
        .children(BEAM_ALPHA.map((a) => div().w(BEAM / BEAM_ALPHA.length).h_full().bg(amber(a))));
      return right(base.bg(amber("24")).border_b(2).border_color(t.blocked)
        .child(sweep)
        .child(div().absolute().left(0).top(0).w(3).h_full().bg(t.blocked))
        .child(div().flex_none().ml(2).px(7).h(18).rounded(4).flex().items_center().bg(t.blocked)
          .font_semibold().text_color(t.background).child("AWAITING INPUT"))
        .child(div().id(`hp-reply-${p.pane}`).flex_1().min_w(0).truncate().cursor_pointer().text_size(11.5).font_family("Geist")
          .text_color(t.foreground).hover((s) => s.text_color(t.blocked))
          .on_click((_e, cx) => { cx.stop_propagation(); run("mod.open", { name: "halo-reply" }); })
          .child(where?.waiting || clean(term?.report?.msg) || "needs your answer")));
    }

    const done = st === "done";
    const ttl = ttlLeft == null ? null : ttlLeft <= 0 ? "TTL COLD" : `TTL ${clock(ttlLeft).replace(/:\d\d$/, "m")}`;
    return right(base
      .child(div().size(6).rounded(3).flex_none().bg(done ? t.done : t.dim))
      .child(div().flex_none().font_semibold().text_color(done ? t.done : t.dim).child(done ? "COMPLETE" : "STANDBY"))
      .child(div().flex_1().min_w(0).truncate().text_size(11.5).font_family("Geist").text_color(t.muted)
        .child(where?.goal || clean(p.title) || name))
      .when(Boolean(ttl), (e) => e.child(div().flex_none().text_color(ttlLeft > 0 && ttlLeft < 300000 ? t.blocked : t.dim).child(ttl))));
  }
}
