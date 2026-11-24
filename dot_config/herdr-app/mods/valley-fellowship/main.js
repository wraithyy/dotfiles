// The fellowship column: every agent across spaces, most urgent first, with what it is
// doing (its terminal title) and, for Claude, how long its prompt cache stays warm.
// Clicking a row focuses that agent; the order also drives agent.next / agent.prev.

import { View, div, image, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, run, theme, setAgentOrder } from "herdr";

const HERO = { claude: "wizard", codex: "dwarf" };
const RANK = { blocked: 4, done: 3, working: 2, idle: 1 };
const LABEL = { blocked: "čeká na tebe", done: "hotovo", working: "na cestě", idle: "odpočívá" };

const CACHE_TTL_MS = 60 * 60 * 1000; // Claude Code prompt cache, 1 h
const WARN_MS = 10 * 60 * 1000;
const CRIT_MS = 5 * 60 * 1000;

const mins = (ms) => {
  const m = Math.max(0, Math.round(ms / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m}m`;
};

// Claude prefixes its title with a spinner/sparkle glyph; the rest is the task summary.
const task = (a) => (a.title || "").replace(/^[^\p{L}\p{N}]+/u, "") || a.program?.name || a.address;

export default class ValleyFellowship extends View {
  init(_props, cx) {
    // ponytail: in memory, resets on app restart (counts from first sight); read transcript mtimes if that bites.
    this.idleSince = {};
    this.last = {};
    cx.timer.every(30000, (cx) => cx.notify());
  }

  track(list) {
    const now = Date.now();
    for (const a of list) {
      const prev = this.last[a.address];
      if (prev === "working" && a.status !== "working") this.idleSince[a.address] = now;
      if (prev === undefined && a.status !== "working") this.idleSince[a.address] ??= now;
      this.last[a.address] = a.status;
    }
  }

  render() {
    const t = theme();
    const raw = agents();
    this.track(raw);
    const list = [...raw].sort((a, b) => (RANK[b.status] ?? 0) - (RANK[a.status] ?? 0) || b.seq - a.seq);
    setAgentOrder(list.map((a) => a.address));

    const cache = (a) => {
      if (a.app !== "claude-code" || a.status === "working" || !this.idleSince[a.address]) return null;
      const left = CACHE_TTL_MS - (Date.now() - this.idleSince[a.address]);
      const color = left <= 0 ? t.dim : left < CRIT_MS ? t.blocked : left < WARN_MS ? (t.ansi3 ?? t.blocked) : t.dim;
      return div().flex_none().text_color(color).child(left <= 0 ? "cache studená" : `cache ${mins(left)}`);
    };

    const row = (a) => {
      let pic = image(`mods/valley-fellowship/sprites/${HERO[a.program?.key] ?? "elf"}.svg`).w(26).h(26).flex_none();
      if (a.status === "blocked") pic = pic.loop("opacity", { from: 0.35, to: 1, period: 700 });
      else if (a.status === "idle") pic = pic.opacity(0.5);
      const status = a.status === "working"
        ? svg("mods/workspace-chrome/spinner.svg").size(10).text_color(t.working).spin(1100)
        : div().size(6).rounded(3).bg(t[a.status] ?? t.dim);
      const c = cache(a);
      return h_flex().id(`fs-${a.address}`).w_full().py(6).px(8).gap(8).items_start().rounded(8).cursor_pointer()
        .when(a.focused, (el) => el.bg(t.selected))
        .hover((st) => st.bg(t.hover))
        .on_click(() => run("agent.focus", { terminal: a.address }))
        .child(v_flex().w(26).flex_none().gap(4).items_center().child(pic).child(status))
        .child(v_flex().flex_1().min_w(0).gap(2)
          .child(div().text_size(12.5).text_color(a.focused ? t.foreground : t.muted).child(task(a)))
          .child(h_flex().gap(5).text_size(10.5).min_w(0)
            .child(div().flex_none().text_color(t[a.status] ?? t.dim).child(LABEL[a.status] ?? ""))
            .child(div().flex_1().min_w(0).truncate().text_color(t.dim).child(`· ${a.space_name ?? ""}`))
            .when(Boolean(c), (el) => el.child(c))));
    };

    return v_flex().id("fellowship").size_full().p(6).gap(2).overflow_y_scrollbar()
      .child(h_flex().px(8).h(26).flex_none().items_center()
        .child(div().font_family("Cinzel").text_size(12).font_semibold().text_color(t.accent).child("Společenstvo")))
      .when(list.length === 0, (el) => el.child(div().px(8).py(6).text_size(12).text_color(t.dim)
        .child("Nikdo není na cestě.")))
      .children(list.map(row));
  }
}
